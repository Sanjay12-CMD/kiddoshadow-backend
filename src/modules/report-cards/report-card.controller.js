import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import {
  createReportCardService,
  saveReportCardMarksService,
  publishReportCardService,
  getReportCardService,
  listReportCardsService,
} from "./report-card.service.js";

/* TEACHER: CREATE */
export const createReportCard = asyncHandler(async (req, res) => {
  const reportCard = await createReportCardService({
    school_id: req.user.school_id,
    ...req.body,
  });

  res.status(201).json({
    success: true,
    data: reportCard,
  });
});

/* TEACHER: SAVE MARKS */
export const saveReportCardMarks = asyncHandler(async (req, res) => {
  await saveReportCardMarksService({
    report_card_id: Number(req.params.id),
    marks: req.body.marks,
    user: req.user,
  });

  res.json({
    success: true,
    message: "Marks saved",
  });
});

/* TEACHER: PUBLISH */
export const publishReportCard = asyncHandler(async (req, res) => {
  const reportCard = await publishReportCardService({
    report_card_id: Number(req.params.id),
    remarks: req.body.remarks,
    user: req.user,
  });

  res.json({
    success: true,
    data: reportCard,
  });
});

/* VIEW (student / parent / teacher) */
export const getReportCard = asyncHandler(async (req, res) => {
  const reportCard = await getReportCardService({
    report_card_id: req.params.id,
  });

  if (!reportCard || !reportCard.published_at) {
    throw new AppError("Report card not available", 404);
  }

  res.json({
    success: true,
    data: reportCard,
  });
});

export const listReportCards = asyncHandler(async (req, res) => {
  const student_id = req.user.additionalClaims?.student_id;

  if (!student_id && req.user.role === 'student') {
    const Student = (await import("../students/student.model.js")).default;
    const s = await Student.findOne({ where: { user_id: req.user.id } });
    if (s) req.user.student_id = s.id;
  }

  const idToUse = student_id || req.user.student_id;

  if (!idToUse) {
    throw new AppError("Student profile not found", 404);
  }

  const result = await listReportCardsService({
    student_id: idToUse,
    school_id: req.user.school_id,
  });

  res.json({
    success: true,
    data: result.rows,
  });
});
