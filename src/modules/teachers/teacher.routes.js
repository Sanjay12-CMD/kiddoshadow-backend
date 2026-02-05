import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { forceFirstLogin } from "../../shared/middlewares/forceFirstLogin.js";
import { validate } from "../../shared/middlewares/validate.js";

import {
  createTeacher,
  listTeachers,
  updateTeacherStatus,
  completeTeacherProfile,
  getMyProfile,
} from "./teacher.controller.js";

import {
  createTeacherSchema,
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
router.use(protect, allowRoles("school_admin"));

router.post(
  "/",
  validate(createTeacherSchema),
  createTeacher
);

router.get("/", listTeachers);

router.patch(
  "/:id/status",
  validate(updateTeacherStatusSchema),
  updateTeacherStatus
);

export default router;
