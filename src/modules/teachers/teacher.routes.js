import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";

import {
  createTeacher,
  getTeacherStudentReports,
  listTeachers,
  listTeachersBySection,
  listTeacherOptions,
  updateTeacherStatus,
  completeTeacherProfile,
  getMyProfile,
} from "./teacher.controller.js";

import {
  updateTeacherStatusSchema,
  completeTeacherProfileSchema,
} from "./teacher.schema.js";

const router = express.Router();

/* teacher self */
router.post(
  "/complete-profile",
  protect,
  validate(completeTeacherProfileSchema),
  completeTeacherProfile
);

router.get("/me", protect, getMyProfile);
router.get(
  "/students-reports",
  protect,
  allowRoles("teacher"),
  getTeacherStudentReports
);

/* admin */
router.post(
  "/",
  protect,
  allowRoles("school_admin"),
  createTeacher
);

router.get(
  "/section/:sectionId",
  protect,
  allowRoles("school_admin"),
  listTeachersBySection
);

router.get(
  "/options",
  protect,
  allowRoles("school_admin"),
  listTeacherOptions
);

router.get(
  "/",
  protect,
  allowRoles("school_admin"),
  listTeachers
);

router.patch(
  "/:id/status",
  protect,
  allowRoles("school_admin"),
  validate(updateTeacherStatusSchema),
  updateTeacherStatus
);

export default router;
