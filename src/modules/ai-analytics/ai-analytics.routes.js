import express from "express";
import auth from "../../shared/middlewares/auth.js";
import allowRoles from "../../shared/middlewares/role.js";
import {
  schoolAiAnalytics,
  teacherAiAnalytics,
  studentAiAnalytics,
} from "./ai-analytics.controller.js";

const router = express.Router();

// school admin / super admin
router.get(
  "/analytics/ai/school",
  auth,
  allowRoles("school_admin", "super_admin"),
  schoolAiAnalytics
);

// teacher
router.get(
  "/analytics/ai/teacher",
  auth,
  allowRoles("teacher"),
  teacherAiAnalytics
);

// student
router.get(
  "/analytics/ai/student",
  auth,
  allowRoles("student"),
  studentAiAnalytics
);

export default router;
