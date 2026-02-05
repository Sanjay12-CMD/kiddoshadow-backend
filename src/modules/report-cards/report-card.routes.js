import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
  createReportCardSchema,
  saveReportCardMarksSchema,
  publishReportCardSchema,
} from "./report-card.schema.js";
import {
  createReportCard,
  saveReportCardMarks,
  publishReportCard,
  getReportCard,
  listReportCards,
} from "./report-card.controller.js";
import {
  allowAdminOrClassTeacher,
} from "../../shared/middlewares/permissions.js";
import { allowRoles } from "../../shared/middlewares/role.js";

const router = express.Router();

router.use(protect);

/* teacher */
router.post("/", allowAdminOrClassTeacher, validate(createReportCardSchema), createReportCard);
router.post(
  "/:id/marks",
  validate(saveReportCardMarksSchema),
  saveReportCardMarks
);
router.post(
  "/:id/publish",
  allowAdminOrClassTeacher,
  validate(publishReportCardSchema),
  publishReportCard
);

/* view */
router.get("/student/list", allowRoles("student"), listReportCards);
router.get("/:id", getReportCard);

export default router;
