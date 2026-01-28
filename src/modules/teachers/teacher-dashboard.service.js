import Class from "../classes/classes.model.js";
import Section from "../sections/section.model.js";
import Timetable from "../timetables/timetable.model.js";
import Homework from "../homework/homework.model.js";
import HomeworkSubmission from "../homework/homework-submission.model.js";
import Student from "../students/student.model.js";
import ReportCard from "../report-cards/report-card.model.js";
import { Op } from "sequelize";

const getToday = () => new Date().toISOString().slice(0, 10);
const getDayName = () =>
  new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

export const getTeacherDashboardService = async ({
  school_id,
  teacher_user_id,
}) => {
  const today = getToday();
  const day = getDayName();

  /* 1️⃣ Classes handled by teacher */
  const classes = await Class.findAll({
    where: {
      school_id,
      class_teacher_id: teacher_user_id,
    },
    include: [{ model: Section }],
  });

  const classIds = classes.map((c) => c.id);

  /* 2️⃣ Timetable (today) */
  const timetable = await Timetable.findAll({
    where: {
      school_id,
      class_id: classIds,
      day_of_week: day,
    },
    order: [["start_time", "ASC"]],
  });

  /* 3️⃣ Homework (today) */
  const homework = await Homework.findAll({
    where: {
      school_id,
      class_id: classIds,
      homework_date: today,
    },
  });

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
  const pendingReportCards = await ReportCard.count({
    where: {
      class_id: classIds,
      published_at: null,
    },
  });

  return {
    classes,
    timetable,
    homework_summary: homeworkSummary,
    pending_report_cards: pendingReportCards,
  };
};
