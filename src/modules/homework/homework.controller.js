import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import {
  createHomeworkService,
  listHomeworkService,
} from "./homework.service.js";

/* TEACHER: CREATE */
export const createHomework = asyncHandler(async (req, res) => {
  const result = await createHomeworkService({
    school_id: req.user.school_id,
    created_by: req.user.id,
    ...req.body,
  });

  if (result?.error === "SECTION_NOT_FOUND") {
    throw new AppError("Section not found or inactive", 404);
  }

  if (result?.error === "SUBJECT_NOT_FOUND") {
    throw new AppError("Subject not found", 404);
  }

  res.status(201).json({
    success: true,
    data: result.homework,
  });
});

/* LIST (teacher / parent / student) */
export const listHomework = asyncHandler(async (req, res) => {
  const homework = await listHomeworkService({
    school_id: req.user.school_id,
    ...req.query,
  });

  res.json({
    success: true,
    data: homework,
  });
});
