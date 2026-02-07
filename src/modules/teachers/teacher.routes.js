import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";

import {
  createTeacher,
  listTeachers,
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

/* admin */
router.post(
  "/",
  protect,
  allowRoles("school_admin"),
  createTeacher
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
