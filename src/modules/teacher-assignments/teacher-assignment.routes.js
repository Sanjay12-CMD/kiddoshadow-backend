import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { assignTeacherSchema } from "./teacher-assignment.schema.js";
import { assignTeacher } from "./teacher-assignment.controller.js";

const router = express.Router();

router.post(
  "/",
  protect,
  allowRoles("school_admin"),
  validate(assignTeacherSchema),
  assignTeacher
);

export default router;
