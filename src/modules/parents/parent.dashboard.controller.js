import asyncHandler from "../../shared/asyncHandler.js";
import { getParentDailyDashboardService } from "./parent.dashboard.service.js";

export const getParentDashboard = asyncHandler(async (req, res) => {
  const data = await getParentDailyDashboardService({
    school_id: req.user.school_id,
    parent_user_id: req.user.id,
  });

  res.json({
    success: true,
    data,
  });
});
