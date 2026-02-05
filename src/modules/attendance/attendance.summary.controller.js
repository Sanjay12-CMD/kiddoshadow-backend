import asyncHandler from "../../shared/asyncHandler.js";
import {
  markAttendanceService,
  getTeacherAttendanceSummaryService,
  getParentAttendanceSummaryService,
  getStudentAttendanceSummaryService,
} from "./attendance.summary.service.js";

/* =========================
   TEACHER: MARK
========================= */
export const markAttendance = asyncHandler(async (req, res) => {
  await markAttendanceService({
    user: req.user,
    school_id: req.user.school_id,
    ...req.body,
  });

  res.status(201).json({
    success: true,
    message: "Attendance marked successfully",
  });
});

/* =========================
   TEACHER: SUMMARY
========================= */
export const getTeacherAttendanceSummary = asyncHandler(async (req, res) => {
  const result = await getTeacherAttendanceSummaryService({
    school_id: req.user.school_id,
    query: req.query,
  });

  res.json({
    total: result.count,
    items: result.rows,
  });
});

/* =========================
   PARENT: SUMMARY
========================= */
export const getParentAttendanceSummary = asyncHandler(async (req, res) => {
  const result = await getParentAttendanceSummaryService({
    parent_user_id: req.user.id,
    query: req.query,
  });

  res.json({
    total: result.count,
    items: result.rows,
  });
});

/* =========================
   STUDENT: SUMMARY
========================= */
export const getStudentAttendanceSummary = asyncHandler(async (req, res) => {
  const result = await getStudentAttendanceSummaryService({
    student_user_id: req.user.id,
    query: req.query,
  });

  res.json({
    total: result.count,
    items: result.rows,
  });
});
