import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";

import {
  teacherCreateParentSchema,
  approveParentSchema,
} from "./parent.approval.schema.js";

import {
  teacherCreateParent,
  approveParent,
} from "./parent.approval.controller.js";

const router = express.Router();

/* =========================
   TEACHER
========================= */
router.post(
  "/teachers/parents",
  protect,
  allowRoles("teacher"),
  validate(teacherCreateParentSchema),
  teacherCreateParent
);

/* =========================
   ADMIN
========================= */
router.post(
  "/admin/parents/:parent_id/approve",
  protect,
  allowRoles("admin"),
  validate(approveParentSchema),
  approveParent
);

export default router;
