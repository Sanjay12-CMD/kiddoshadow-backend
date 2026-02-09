import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import {
  schoolAiAnalytics,
  schoolUserUsage,
  schoolClassUsage,
  teacherAiAnalytics,
  studentAiAnalytics,
} from "./ai-analytics.controller.js";

const router = express.Router();

// school admin / super admin
router.get(
  "/analytics/ai/school",
  protect,
  allowRoles("school_admin", "super_admin"),
  schoolAiAnalytics
);

// school admin / super admin: per user usage
router.get(
  "/analytics/ai/school/users",
  protect,
  allowRoles("school_admin", "super_admin"),
  schoolUserUsage
);

// school admin / super admin: per class usage (students)
router.get(
  "/analytics/ai/school/classes",
  protect,
  allowRoles("school_admin", "super_admin"),
  schoolClassUsage
);

// teacher
router.get(
  "/analytics/ai/teacher",
  protect,
  allowRoles("teacher"),
  teacherAiAnalytics
);

// student
router.get(
  "/analytics/ai/student",
  protect,
  allowRoles("student"),
  studentAiAnalytics
);

export default router;
