import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import {
  submitSinglePlayerQuiz,
  startSinglePlayerQuiz,
  createMultiplayerQuiz,
  getLeaderboard,
  joinMultiplayerQuiz,
} from "./game.controller.js";

const router = express.Router();

router.use(protect);

router.post(
  "/quiz/single/start",
  allowRoles("student", "teacher"),
  startSinglePlayerQuiz
);

router.post(
  "/quiz/multi/create",
  allowRoles("student", "teacher"),
  createMultiplayerQuiz
);

router.post(
  "/quiz/single/submit",
  allowRoles("student", "teacher"),
  submitSinglePlayerQuiz
);

router.get(
  "/quiz/:sessionId/leaderboard",
  allowRoles("student", "teacher"),
  getLeaderboard
);

router.post(
  "/quiz/multi/join",
  allowRoles("student", "teacher"),
  joinMultiplayerQuiz
);

export default router;
