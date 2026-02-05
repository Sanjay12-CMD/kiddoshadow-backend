import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { validate } from "../../shared/middlewares/validate.js";
import { submitHomework } from "./homework-submission.controller.js";
import {
  createHomeworkSchema,
  listHomeworkSchema,
  submitHomeworkSchema,
} from "./homework.schema.js";
import {
  createHomework,
  listHomework,
  getHomeworkSummary,
  getHomeworkStudentStatus,
} from "./homework.controller.js";
import {
  allowAdminOrSectionClassTeacher,
} from "../../shared/middlewares/permission.js";


const router = express.Router();

router.use(protect);

router.post("/", allowAdminOrSectionClassTeacher, validate(createHomeworkSchema), createHomework);
router.get("/", validate(listHomeworkSchema), listHomework);

router.post(
  "/:homework_id/submit",
  validate(submitHomeworkSchema),
  submitHomework
);

router.get("/analytics/summary", getHomeworkSummary);
router.get(
  "/analytics/:homework_id/students",
  getHomeworkStudentStatus
);

export default router;
