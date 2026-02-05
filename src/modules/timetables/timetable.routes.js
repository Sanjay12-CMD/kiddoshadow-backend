import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { saveTimetableSchema } from "./timetable.schema.js";
import {
  saveTimetable,
  getSectionTimetable,
  getTeacherTimetable,
} from "./timetable.controller.js";

const router = express.Router();

router.use(protect);

// Admin or Teacher: Save timetable
router.post(
  "/",
  allowRoles("school_admin", "teacher"),
  validate(saveTimetableSchema),
  saveTimetable
);

// Student/Parent: View section timetable
router.get("/section", getSectionTimetable);

// Teacher: View own timetable
router.get("/teacher/me", allowRoles("teacher"), getTeacherTimetable);

export default router;
