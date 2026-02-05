import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
  assignTeacherSchema,
  updateTeacherAssignmentSchema,
} from "./teacher-assignment.schema.js";
import {
  assignTeacher,
  listAssignments,
  getTeacherAssignments,
  getSectionAssignments,
  updateAssignment,
  deleteAssignment,
} from "./teacher-assignment.controller.js";

const router = express.Router();

router.use(protect);

/* ADMIN: CREATE ASSIGNMENT */
router.post(
  "/",
  allowRoles("admin"),
  validate(assignTeacherSchema),
  assignTeacher
);

/* ADMIN: LIST ALL ASSIGNMENTS */
router.get("/", allowRoles("admin"), listAssignments);

/* TEACHER/ADMIN: GET TEACHER'S ASSIGNMENTS */
router.get(
  "/teacher/:teacherId",
  allowRoles("admin", "teacher"),
  getTeacherAssignments
);

/* ADMIN: GET SECTION ASSIGNMENTS */
router.get("/section/:sectionId", allowRoles("admin"), getSectionAssignments);

/* ADMIN: UPDATE ASSIGNMENT */
router.patch(
  "/:id",
  allowRoles("admin"),
  validate(updateTeacherAssignmentSchema),
  updateAssignment
);

/* ADMIN: DELETE ASSIGNMENT */
router.delete("/:id", allowRoles("admin"), deleteAssignment);

export default router;

