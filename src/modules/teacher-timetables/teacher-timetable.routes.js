import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";

import {
  createTeacherTimetableSchema,
} from "./teacher-timetable.schema.js";

import {
  getMyTimetable,
  createTeacherTimetable,
} from "./teacher-timetable.controller.js";

const router = express.Router();

/* TEACHER: view my timetable */
router.get(
  "/me",
  protect,
  allowRoles("teacher"),
  getMyTimetable
);

/* ADMIN: create timetable entry */
router.post(
  "/",
  protect,
  allowRoles("school_admin"),
  validate(createTeacherTimetableSchema),
  createTeacherTimetable
);

export default router;
