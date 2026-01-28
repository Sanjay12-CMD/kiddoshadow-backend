import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { validate } from "../../shared/middlewares/validate.js";
import { saveTimetableSchema } from "./timetable.schema.js";
import {
  saveTimetable,
  getTimetable,
} from "./timetable.controller.js";
import {
  allowAdminOrSectionClassTeacher,
} from "../../shared/middlewares/permissions.js";


const router = express.Router();

router.use(protect);

// teacher/admin
router.post("/", allowAdminOrSectionClassTeacher, validate(saveTimetableSchema), saveTimetable);

// student / parent / teacher
router.get("/", getTimetable);

export default router;
