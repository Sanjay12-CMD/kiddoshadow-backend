import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import {
  createReportCardService,
  saveReportCardMarksService,
  publishReportCardService,
  getReportCardService,
} from "./report-card.service.js";

/* TEACHER: CREATE */
export const createReportCard = asyncHandler(async (req, res) => {
  const result = await createReportCardService({
    school_id: req.user.school_id,
    ...req.body,
  });

  if (result?.error === "EXAM_NOT_FOUND") {
    throw new AppError("Exam not found", 404);
  }
  if (result?.error === "STUDENT_NOT_FOUND") {
    throw new AppError("Student not found", 404);
  }
  if (result?.error === "REPORT_CARD_EXISTS") {
    throw new AppError("Report card already exists", 409);
  }

  res.status(201).json({
    success: true,
    data: result.reportCard,
  });
});

/* TEACHER: SAVE MARKS */
export const saveReportCardMarks = asyncHandler(async (req, res) => {
  const ok = await saveReportCardMarksService({
    report_card_id: req.params.id,
    marks: req.body.marks,
  });

  if (!ok) {
    throw new AppError("Report card not found", 404);
  }

  res.json({
    success: true,
    message: "Marks saved",
  });
});

/* TEACHER: PUBLISH */
export const publishReportCard = asyncHandler(async (req, res) => {
  const reportCard = await publishReportCardService({
    report_card_id: req.params.id,
    remarks: req.body.remarks,
    publisher_user_id: req.user.id,
  });

  if (!reportCard) {
    throw new AppError("Report card not found", 404);
  }

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
