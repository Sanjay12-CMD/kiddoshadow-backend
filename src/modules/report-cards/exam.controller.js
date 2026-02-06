import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import {
  createExamService,
  lockExamService,
  listExamsByClassService,
} from "./exam.service.js";

export const createExam = asyncHandler(async (req, res) => {
  const exam = await createExamService({
    school_id: req.user.school_id,
    ...req.body,
  });

  res.status(201).json({
    success: true,
    data: exam,
  });
});

export const lockExam = asyncHandler(async (req, res) => {
  const exam = await lockExamService({
    exam_id: Number(req.params.id),
    school_id: req.user.school_id,
  });

  res.json({
    success: true,
    data: exam,
  });
});

export const listExamsByClass = asyncHandler(async (req, res) => {
  const result = await listExamsByClassService({
    school_id: req.user.school_id,
    class_id: Number(req.query.class_id),
    query: req.query,
  });

  res.json({
    success: true,
    total: result.count,
    items: result.rows,
  });
});
