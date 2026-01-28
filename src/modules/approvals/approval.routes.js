import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";

import { listPendingApprovalsSchema } from "./approval.schema.js";
import {
  getTeacherPendingApprovals,
  getAdminPendingApprovals,
} from "./approval.controller.js";

const router = express.Router();

/* =========================
   TEACHER
========================= */
router.get(
  "/teachers/approvals/pending",
  protect,
  allowRoles("teacher"),
  validate(listPendingApprovalsSchema),
  getTeacherPendingApprovals
);

/* =========================
   ADMIN
========================= */
router.get(
  "/admin/approvals/pending",
  protect,
  allowRoles("admin"),
  validate(listPendingApprovalsSchema),
  getAdminPendingApprovals
);

export default router;
