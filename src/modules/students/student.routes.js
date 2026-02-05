import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { forceFirstLogin } from "../../shared/middlewares/forceFirstLogin.js";
import { validate } from "../../shared/middlewares/validate.js";


import {
  autoCreateStudents,
  listStudents,
  moveStudent,
  updateStudentStatus,
  completeStudentProfile,
  getMyProfile,
  assignStudentsToSection,
} from "./student.controller.js";

import {
  autoCreateStudentsSchema,
  completeStudentProfileSchema,
  moveStudentSchema,
  updateStudentStatusSchema,
  assignStudentsToSectionSchema,
} from "./student.schema.js";

const router = express.Router();

/* student self */
router.post(
  "/complete-profile",
  protect,
  validate(completeStudentProfileSchema),
  completeStudentProfile
);

router.get("/me", protect, getMyProfile);

/* admin */
router.use(protect, allowRoles("school_admin"));

router.post(
  "/auto-create",
  validate(autoCreateStudentsSchema),
  autoCreateStudents
);

router.get("/", listStudents);

router.patch(
  "/:id/move",
  validate(moveStudentSchema),
  moveStudent
);

router.patch(
  "/:id/status",
  validate(updateStudentStatusSchema),
  updateStudentStatus
);

router.post(
  "/assign-section",
  validate(assignStudentsToSectionSchema),
  assignStudentsToSection
);

export default router;
