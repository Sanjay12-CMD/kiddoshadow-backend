import express from "express";
import auth from "../../shared/middlewares/auth.js";
import allowRoles from "../../shared/middlewares/role.js";
import { teacherAiHandler } from "./teacher-ai.controller.js";

const router = express.Router();

router.post(
  "/teacher/ai",
  auth,
  allowRoles("teacher"),
  teacherAiHandler
);

export default router;
