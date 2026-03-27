import Class from "../classes/classes.model.js";
import Section from "../sections/section.model.js";
import Timetable from "../timetables/timetable.model.js";
import Homework from "../homework/homework.model.js";
import HomeworkSubmission from "../homework/homework-submission.model.js";
import Student from "../students/student.model.js";
import ReportCard from "../report-cards/report-card.model.js";
import TeacherAssignment from "../teacher-assignments/teacher-assignment.model.js";
import TokenAccount from "../tokens/token-account.model.js";
import { ensureTokenAccount } from "../tokens/token.service.js";
import AiChatLog from "../ai-chat-logs/ai-chat-log.model.js";
import AITestAssignment from "../ai-test-assignments/ai-test-assignment.model.js";
import AITestSubmission from "../ai-test-assignments/ai-test-submission.model.js";

const getToday = () => new Date().toISOString().slice(0, 10);
const getDayName = () =>
  new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

const ALLOWED_DAYS = new Set([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
]);

export const getTeacherDashboardService = async ({
  school_id,
  teacher_id,
  user_id,
}) => {
  const teacherIds = Array.isArray(teacher_id) ? teacher_id : [teacher_id];
  const today = getToday();
  const day = getDayName();

  /* 1) Classes handled by teacher */
  const assignments = await TeacherAssignment.findAll({
    where: {
      school_id,
      teacher_id: teacherIds.filter(Boolean),
      is_active: true,
    },
    attributes: ["class_id", "section_id"],
  });

  const classIds = [...new Set(assignments.map((a) => a.class_id))];
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

  /* 2) Timetable (today) */
  const timetable =
    classIds.length && ALLOWED_DAYS.has(day)
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

  /* 3) Homework (today) */
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

  /* 4) Homework completion */
  const submissions = await HomeworkSubmission.findAll({
    where: { homework_id: homeworkIds },
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
        pending: totalStudents - (submissionCountMap[h.id] || 0),
      };
    })
  );

  /* 5) Pending report cards */
  const pendingReportCards = classIds.length
    ? await ReportCard.count({
        where: {
          class_id: classIds,
          published_at: null,
        },
      })
    : 0;

  // 6) AI Tokens (lifetime used + current balance)
  await ensureTokenAccount(user_id);
  const tokenAccount = await TokenAccount.findOne({
    where: { user_id },
    attributes: ["balance"],
  });
  const usedTotal = await AiChatLog.sum("tokens_used", {
    where: { user_id },
  });
  const used = usedTotal || 0;
  const remaining = tokenAccount?.balance ?? 0;
  const total = used + remaining;

  const assignedTests = await AITestAssignment.findAll({
    where: {
      school_id,
      teacher_id: teacherIds.filter(Boolean),
      is_active: true,
    },
    include: [{ model: AITestSubmission, attributes: ["id", "status", "percentage"] }],
    order: [["created_at", "DESC"]],
    limit: 5,
  });

  const allSubmissions = assignedTests.flatMap((item) => item.ai_test_submissions || []);
  const reviewedSubmissions = allSubmissions.filter(
    (item) => item.percentage !== null && item.percentage !== undefined
  );
  const classAverage = reviewedSubmissions.length
    ? Number(
        (
          reviewedSubmissions.reduce((sum, item) => sum + Number(item.percentage || 0), 0) /
          reviewedSubmissions.length
        ).toFixed(2)
      )
    : 0;

  return {
    classes,
    timetable,
    homework_summary: homeworkSummary,
    pending_report_cards: pendingReportCards,
    ai_tokens: { total, used, remaining },
    assigned_tests: {
      total: assignedTests.length,
      attempted: allSubmissions.filter((item) => item.status === "completed").length,
      pending: allSubmissions.filter((item) => item.status === "pending").length,
      missed: allSubmissions.filter((item) => item.status === "missed").length,
      class_average_percentage: classAverage,
    },
  };
};
