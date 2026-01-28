import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import { submitHomeworkService } from "./homework-submission.service.js";

/* STUDENT: SUBMIT / UPDATE */
export const submitHomework = asyncHandler(async (req, res) => {
  const result = await submitHomeworkService({
    school_id: req.user.school_id,
    student_id: req.user.id, // student user
    homework_id: req.params.homework_id,
    ...req.body,
  });

  if (result?.error === "HOMEWORK_NOT_FOUND") {
    throw new AppError("Homework not found", 404);
  }

  res.json({
    success: true,
    data: result.submission,
  });
});
