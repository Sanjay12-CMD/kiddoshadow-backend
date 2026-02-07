import Class from "../classes/classes.model.js";
import Section from "../sections/section.model.js";
import Timetable from "../timetables/timetable.model.js";
import Homework from "../homework/homework.model.js";
import HomeworkSubmission from "../homework/homework-submission.model.js";
import Student from "../students/student.model.js";
import ReportCard from "../report-cards/report-card.model.js";
import TeacherAssignment from "../teacher-assignments/teacher-assignment.model.js";
import { Op } from "sequelize";

const getToday = () => new Date().toISOString().slice(0, 10);
const getDayName = () =>
  new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

export const getTeacherDashboardService = async ({
  school_id,
  teacher_id,
}) => {
  const today = getToday();
  const day = getDayName();

  /* 1️⃣ Classes handled by teacher */
  const assignments = await TeacherAssignment.findAll({
    where: {
      school_id,
      teacher_id,
      is_active: true,
    },
    attributes: ["class_id", "section_id"],
  });

  const classIds = [
    ...new Set(assignments.map((a) => a.class_id)),
  ];
  const sectionIds = assignments.map((a) => a.section_id);

  const classes = classIds.length
    ? await Class.findAll({
        where: { school_id, id: classIds },
        include: [
          {
            model: Section,
            where: { id: sectionIds },
            required: true,
          },
        ],
      })
    : [];

  /* 2️⃣ Timetable (today) */
  const timetable = classIds.length
    ? await Timetable.findAll({
        where: {
          school_id,
          class_id: classIds,
          section_id: sectionIds,
          day_of_week: day,
        },
        order: [["start_time", "ASC"]],
      })
    : [];

  /* 3️⃣ Homework (today) */
  const homework = classIds.length
    ? await Homework.findAll({
        where: {
          school_id,
          class_id: classIds,
          section_id: sectionIds,
          homework_date: today,
        },
      })
    : [];

  const homeworkIds = homework.map((h) => h.id);

  /* 4️⃣ Homework completion */
  const submissions = await HomeworkSubmission.findAll({
    where: {
      homework_id: homeworkIds,
    },
  });

  const submissionCountMap = {};
  submissions.forEach((s) => {
    if (!submissionCountMap[s.homework_id]) {
      submissionCountMap[s.homework_id] = 0;
    }
    if (s.is_completed) {
      submissionCountMap[s.homework_id]++;
    }
  });

  const homeworkSummary = await Promise.all(
    homework.map(async (h) => {
      const totalStudents = await Student.count({
        where: {
          class_id: h.class_id,
          section_id: h.section_id,
          is_active: true,
        },
      });

      return {
        homework_id: h.id,
        class_id: h.class_id,
        section_id: h.section_id,
        description: h.description,
        completed: submissionCountMap[h.id] || 0,
        total_students: totalStudents,
        pending:
          totalStudents - (submissionCountMap[h.id] || 0),
      };
    })
  );

  /* 5️⃣ Pending report cards */
  const pendingReportCards = classIds.length
    ? await ReportCard.count({
        where: {
          class_id: classIds,
          published_at: null,
        },
      })
    : 0;

  return {
    classes,
    timetable,
    homework_summary: homeworkSummary,
    pending_report_cards: pendingReportCards,
  };
};
