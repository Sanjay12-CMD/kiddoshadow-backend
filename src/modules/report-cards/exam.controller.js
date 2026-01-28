import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import {
  createExamService,
  lockExamService,
  listExamsByClassService,
} from "./exam.service.js";

export const createExam = asyncHandler(async (req, res) => {
  const result = await createExamService({
    school_id: req.user.school_id,
    ...req.body,
  });

  if (result?.error === "EXAM_EXISTS") {
    throw new AppError("Exam already exists for this class", 409);
  }

  res.status(201).json({
    success: true,
    data: result.exam,
  });
});

export const lockExam = asyncHandler(async (req, res) => {
  const exam = await lockExamService({
    exam_id: req.params.id,
  });

  if (!exam) {
    throw new AppError("Exam not found", 404);
  }

  res.json({
    success: true,
    data: exam,
  });
});

export const listExamsByClass = asyncHandler(async (req, res) => {
  const exams = await listExamsByClassService({
    school_id: req.user.school_id,
    class_id: req.query.class_id,
  });

  res.json({
    success: true,
    data: exams,
  });
});
