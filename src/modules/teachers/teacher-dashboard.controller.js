import asyncHandler from "../../shared/asyncHandler.js";
import { getTeacherDashboardService } from "./teacher-dashboard.service.js";

export const getTeacherDashboard = asyncHandler(async (req, res) => {
  const data = await getTeacherDashboardService({
    school_id: req.user.school_id,
    teacher_user_id: req.user.id,
  });

  res.json({
    success: true,
    data,
  });
});
