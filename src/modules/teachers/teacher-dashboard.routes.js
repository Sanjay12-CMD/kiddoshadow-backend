import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { validate } from "../../shared/middlewares/validate.js";
import { allowRoles } from "../../shared/middlewares/role.js";

import { teacherDashboardSchema } from "./teacher-dashboard.schema.js";
import { getTeacherDashboard } from "./teacher-dashboard.controller.js";

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  allowRoles("teacher"),
  validate(teacherDashboardSchema),
  getTeacherDashboard
);

export default router;
