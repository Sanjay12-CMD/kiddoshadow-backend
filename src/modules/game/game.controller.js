import User from "../users/user.model.js";
import GameSession from "./game-session.model.js";
import GameSessionPlayer from "./game-session-player.model.js";
import PlayerAnswer from "./player-answer.model.js";
import QuizQuestion from "../quiz/quiz-question.model.js";
import { isTimeOver } from "./game.utils.js";
import AppError from "../../shared/appError.js";
import asyncHandler from "../../shared/asyncHandler.js";
import db from "../../config/db.js";

export const submitSinglePlayerQuiz = asyncHandler(async (req, res) => {
  const { playerId, answers } = req.body;

  const player = await GameSessionPlayer.findByPk(playerId, {
    include: [{ model: GameSession }],
  });

  if (!player) {
    throw new AppError("Player not found", 404);
  }

  if (player.status === "FINISHED") {
    throw new AppError("Quiz already submitted", 409);
  }

  const session = player.GameSession;

  // ⬅️ AUTHORITATIVE TIME CHECK
  if (isTimeOver(session)) {
    if (session.status !== "FINISHED") {
      await session.update({ status: "FINISHED" });
    }
    throw new AppError("Time is over", 403);
  }

  let score = 0;

  await db.transaction(async (t) => {
    for (const ans of answers) {
      const question = await QuizQuestion.findByPk(ans.questionId, { transaction: t });

      const isCorrect =
        question.correct_option_index === ans.selectedIndex;

      if (isCorrect) score++;

      await PlayerAnswer.create(
        {
          session_player_id: playerId,
          question_id: ans.questionId,
          selected_option_index: ans.selectedIndex,
          is_correct: isCorrect,
        },
        { transaction: t }
      );
    }

    await player.update(
      {
        score,
        status: "FINISHED",
        finished_at: new Date(),
      },
      { transaction: t }
    );
  });

  res.json({ score, total: answers.length });
});

export const startSinglePlayerQuiz = asyncHandler(async (req, res) => {
  const { quizId, timeLimitMinutes } = req.body;

  const session = await GameSession.create({
    quiz_id: quizId,
    mode: "SINGLE",
    host_user_id: req.user.id,
    total_time_ms: timeLimitMinutes * 60 * 1000,
    status: "IN_PROGRESS",
    started_at: new Date(),
  });

  const player = await GameSessionPlayer.create({
    session_id: session.id,
    user_id: req.user.id,
    is_host: true,
    status: "PLAYING",
  });

  res.json({ sessionId: session.id, playerId: player.id });
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const leaderboard = await GameSessionPlayer.findAll({
    where: { session_id: sessionId },
    order: [["score", "DESC"], ["finished_at", "ASC"]],
    include: [{ model: User, attributes: ["id", "name"] }],
    attributes: ["score", "finished_at"],
  });

  res.json(leaderboard);
});

export const joinMultiplayerQuiz = asyncHandler(async (req, res) => {
  const { roomCode } = req.body;

  const session = await GameSession.findOne({
    where: { room_code: roomCode },
  });

  if (!session) {
    throw new AppError("Room not found", 404);
  }

  // 👩‍🏫 TEACHER / HOST LOGIC
  // Teachers don't join as players. They just need the session ID to enter the lobby as host.
  if (req.user.role === "teacher") {
    // Optional: Check if this teacher is actually the host? 
    // Usually yes, but even if another teacher joins, maybe they just observe?
    // For now, allow any teacher to 'join' the view, but client handles "Start" button visibility based on ID.
    return res.json({
      sessionId: session.id,
      isTeacher: true,
      isHost: session.host_user_id === req.user.id,
    });
  }

  // 🎓 STUDENT LOGIC
  if (session.status === "FINISHED") {
    throw new AppError("Quiz already finished", 403);
  }

  if (isTimeOver(session)) {
    await session.update({ status: "FINISHED" });
    throw new AppError("Quiz time is over", 403);
  }

  const existing = await GameSessionPlayer.findOne({
    where: {
      session_id: session.id,
      user_id: req.user.id,
    },
  });

  if (existing) {
    return res.json({
      sessionId: session.id,
      playerId: existing.id,
    });
  }

  const count = await GameSessionPlayer.count({
    where: { session_id: session.id },
  });

  if (session.max_players && count >= session.max_players) {
    throw new AppError("Room is full", 403);
  }

  const player = await GameSessionPlayer.create({
    session_id: session.id,
    user_id: req.user.id,
    is_host: session.host_user_id === req.user.id, // Should usually be false for students if teacher created it
    status: "WAITING",
  });

  res.json({
    sessionId: session.id,
    playerId: player.id,
  });
});
