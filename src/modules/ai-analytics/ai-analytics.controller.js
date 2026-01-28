import asyncHandler from "../../shared/asyncHandler.js";
import {
  getSchoolAnalytics,
  getTeacherAnalytics,
  getStudentDailyUsage,
} from "./ai-analytics.service.js";

/* ===================== SCHOOL ===================== */
export const schoolAiAnalytics = asyncHandler(async (req, res) => {
  const schoolId = req.user.school_id;

  const data = await getSchoolAnalytics(schoolId);
  res.json(data);
});

/* ===================== TEACHER ===================== */
export const teacherAiAnalytics = asyncHandler(async (req, res) => {
  const teacherUserId = req.user.id;

  const data = await getTeacherAnalytics(teacherUserId);
  res.json(data);
});

/* ===================== STUDENT ===================== */
export const studentAiAnalytics = asyncHandler(async (req, res) => {
  const studentUserId = req.user.id;

  const data = await getStudentDailyUsage(studentUserId);
  res.json(data);
});
