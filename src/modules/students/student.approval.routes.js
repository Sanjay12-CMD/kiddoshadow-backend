import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";

import {
  requestStudentProfileUpdateSchema,
} from "./student.approval.schema.js";

import {
  requestStudentProfileUpdate,
} from "./student.approval.controller.js";

const router = express.Router();

/* STUDENT */
router.patch(
  "/students/profile/request",
  protect,
  allowRoles("student"),
  validate(requestStudentProfileUpdateSchema),
  requestStudentProfileUpdate
);

export default router;
