import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import {
  createHomeworkService,
  listHomeworkService,
} from "./homework.service.js";

/* TEACHER: CREATE */
export const createHomework = asyncHandler(async (req, res) => {
  const homework = await createHomeworkService({
    user: req.user,
    school_id: req.user.school_id,
    ...req.body,
  });

  res.status(201).json({
    success: true,
    data: homework,
  });
});

/* LIST (teacher / parent / student) */
export const listHomework = asyncHandler(async (req, res) => {
  const result = await listHomeworkService({
    school_id: req.user.school_id,
    ...req.query,
    query: req.query,
  });

  res.json({
    success: true,
    total: result.count,
    items: result.rows,
  });
});
export const getHomeworkSummary = asyncHandler(async (req, res) => {
  res.json({ success: true, data: {} });
});

export const getHomeworkStudentStatus = asyncHandler(async (req, res) => {
  res.json({ success: true, data: [] });
});
