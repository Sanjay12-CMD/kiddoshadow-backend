import asyncHandler from "../../shared/asyncHandler.js";
import * as service from "./teacher-timetable.service.js";

/* TEACHER */
export const getMyTimetable = asyncHandler(async (req, res) => {
  const day = Number(req.query.day);

  const timetable = await service.getTeacherTimetable({
    teacherId: req.user.id,
    day,
  });

  res.json(timetable);
});

/* ADMIN */
export const createTeacherTimetable = asyncHandler(async (req, res) => {
  const timetable = await service.createTimetable({
    ...req.body,
    school_id: req.user.school_id,
  });

  res.status(201).json(timetable);
});
