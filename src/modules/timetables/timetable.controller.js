import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import {
  saveTimetableService,
  getTimetableService,
} from "./timetable.service.js";

/* TEACHER/ADMIN: SAVE */
export const saveTimetable = asyncHandler(async (req, res) => {
  const result = await saveTimetableService({
    school_id: req.user.school_id,
    ...req.body,
  });

  if (result?.error === "SECTION_NOT_FOUND") {
    throw new AppError("Section not found or inactive", 404);
  }

  res.json({
    success: true,
    message: "Timetable saved successfully",
  });
});

/* STUDENT / PARENT / TEACHER: VIEW */
export const getTimetable = asyncHandler(async (req, res) => {
  const timetable = await getTimetableService({
    school_id: req.user.school_id,
    class_id: req.query.class_id,
    section_id: req.query.section_id,
  });

  res.json({
    success: true,
    data: timetable,
  });
});
