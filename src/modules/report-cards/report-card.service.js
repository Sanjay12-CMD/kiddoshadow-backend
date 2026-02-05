import ReportCard from "./report-card.model.js";
import ReportCardMark from "./report-card-mark.model.js";
import Exam from "./exam.model.js";
import Student from "../students/student.model.js";
import { triggerReportCardNotification } from "../notifications/notification-trigger.service.js";

/* =========================
   CREATE (DRAFT)
========================= */
export const createReportCardService = async ({
  school_id,
  student_id,
  exam_id,
}) => {
  const exam = await Exam.findOne({
    where: { id: exam_id, school_id },
  });
  if (!exam) return { error: "EXAM_NOT_FOUND" };

  if (exam.is_locked) {
    return { error: "EXAM_LOCKED" };
  }

  const student = await Student.findOne({
    where: { id: student_id, school_id },
  });
  if (!student) return { error: "STUDENT_NOT_FOUND" };

  const exists = await ReportCard.findOne({
    where: { student_id, exam_id },
  });
  if (exists) return { error: "REPORT_CARD_EXISTS" };

  const reportCard = await ReportCard.create({
    student_id,
    class_id: student.class_id,
    exam_id,
  });

  return { reportCard };
};

/* =========================
   SAVE / UPDATE MARKS
========================= */
export const saveReportCardMarksService = async ({
  report_card_id,
  marks,
}) => {
  const reportCard = await ReportCard.findByPk(report_card_id);
  if (!reportCard) return null;

  const exam = await Exam.findByPk(reportCard.exam_id);
  if (exam?.is_locked) {
    return { error: "EXAM_LOCKED" };
  }

  // manual overwrite (by design)
  await ReportCardMark.destroy({
    where: { report_card_id },
  });

  for (const m of marks) {
    await ReportCardMark.create({
      report_card_id,
      subject_id: m.subject_id,
      marks_obtained: m.marks_obtained,
      max_marks: m.max_marks,
    });
  }

  return true;
};

/* =========================
   PUBLISH
========================= */
export const publishReportCardService = async ({
  report_card_id,
  remarks,
  publisher_user_id, // teacher/admin
}) => {
  const reportCard = await ReportCard.findByPk(report_card_id);
  if (!reportCard) return null;

  if (reportCard.published_at) {
    return { error: "ALREADY_PUBLISHED" };
  }

  const exam = await Exam.findByPk(reportCard.exam_id);
  if (exam?.is_locked) {
    return { error: "EXAM_LOCKED" };
  }

  reportCard.remarks = remarks;
  reportCard.published_at = new Date();
  await reportCard.save();

  // ===== Notification Trigger =====
  const student = await Student.findByPk(reportCard.student_id);

  if (student) {
    await triggerReportCardNotification({
      school_id: student.school_id,
      teacher_user_id: publisher_user_id,
      student_name: student.name,
      exam_name: exam?.name || "Exam",
      class_id: student.class_id,
      section_id: student.section_id,
    });
  }

  return reportCard;
};

/* =========================
   VIEW
========================= */
export const getReportCardService = async ({ report_card_id }) => {
  return ReportCard.findByPk(report_card_id, {
    include: [
      {
        model: ReportCardMark,
      },
      {
        model: Exam,
      },
    ],
  });
};

export const listReportCardsService = async ({ student_id, school_id }) => {
  return toList(ReportCard.findAll({
    where: { student_id },
    include: [
      {
        model: Exam,
        where: { school_id },
        attributes: ["id", "name", "date"],
      },
    ],
    order: [[Exam, "date", "DESC"]],
  }));
};

async function toList(promise) {
  const list = await promise;
  return { count: list.length, rows: list };
}
