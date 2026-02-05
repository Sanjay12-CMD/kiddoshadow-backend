import asyncHandler from "../../shared/asyncHandler.js";
import {
  saveTimetableService,
  getSectionTimetableService,
  getTeacherTimetableService,
} from "./timetable.service.js";

/* TEACHER/ADMIN: SAVE TIMETABLE */
export const saveTimetable = asyncHandler(async (req, res) => {
  await saveTimetableService({
    user: req.user,
    school_id: req.user.school_id,
    ...req.body,
  });

  res.json({
    success: true,
    message: "Timetable saved successfully",
  });
});

/* STUDENT / PARENT: VIEW SECTION TIMETABLE */
export const getSectionTimetable = asyncHandler(async (req, res) => {
  const timetable = await getSectionTimetableService({
    school_id: req.user.school_id,
    class_id: Number(req.query.class_id),
    section_id: Number(req.query.section_id),
  });

  res.json({
    success: true,
    data: timetable,
  });
});

/* TEACHER: VIEW OWN TIMETABLE */
export const getTeacherTimetable = asyncHandler(async (req, res) => {
  const timetable = await getTeacherTimetableService({
    school_id: req.user.school_id,
    teacher_id: req.user.teacher_id,
  });

  res.json({
    success: true,
    data: timetable,
  });
});
