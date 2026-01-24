import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import GameSession from "../modules/game/game-session.model.js";
import GameSessionPlayer from "../modules/game/game-session-player.model.js";
import { isTimeOver } from "../modules/game/game.utils.js";
import PlayerAnswer from "../modules/game/player-answer.model.js";
import QuizQuestion from "../modules/game/quiz-question.model.js";
import sequelize from "../db/index.js";

export function initGameSocket(io) {

  // 🔐 SOCKET JWT AUTH
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.user = {
        id: decoded.id,
        role: decoded.role,
        school_id: decoded.school_id,
      };

      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {

    /**
     * JOIN QUIZ ROOM
     */
    socket.on("quiz:join", async ({ sessionId }) => {
      const player = await GameSessionPlayer.findOne({
        where: {
          session_id: sessionId,
          user_id: socket.user.id,
        },
      });

      if (!player) {
        socket.emit("quiz:error", { message: "Not registered for this quiz" });
        return;
      }

      // Prevent multi-join
      if (
        player.socket_id &&
        player.socket_id !== socket.id &&
        player.status !== "DISCONNECTED"
      ) {
        socket.emit("quiz:error", {
          message: "Already joined from another device/tab",
        });
        return;
      }

      await player.update({
        socket_id: socket.id,
        status: player.status === "DISCONNECTED"
          ? "PLAYING"
          : player.status,
      });

      socket.join(`quiz:${sessionId}`);

      socket.emit("quiz:joined", {
        sessionId,
        playerId: player.id,
        status: player.status,
      });
    });

    /**
     * HOST STARTS QUIZ
     */
    socket.on("quiz:start", async ({ sessionId }) => {
      const session = await GameSession.findByPk(sessionId);
      if (!session) return;
      if (session.host_user_id !== socket.user.id) return;

      // prevent restart
      if (session.started_at) return;

      await session.update({
        status: "IN_PROGRESS",
        started_at: new Date(),
      });

      await GameSessionPlayer.update(
        { status: "PLAYING" },
        {
          where: {
            session_id: sessionId,
            status: { [Op.ne]: "FINISHED" },
          },
        }
      );

      io.to(`quiz:${sessionId}`).emit("quiz:started", {
        startedAt: session.started_at,
        totalTimeMs: session.total_time_ms,
      });
    });

    /**
     * PLAYER FINISHES QUIZ
     */
    socket.on("quiz:finished", async ({ sessionId }) => {
      const player = await GameSessionPlayer.findOne({
        where: {
          session_id: sessionId,
          user_id: socket.user.id,
        },
      });

      if (!player || player.status === "FINISHED") return;

      const session = await GameSession.findByPk(sessionId);
      if (!session) return;

      // ⬅️ AUTHORITATIVE TIME CHECK
      if (isTimeOver(session)) {
        if (session.status !== "FINISHED") {
          await session.update({ status: "FINISHED" });
          io.to(`quiz:${sessionId}`).emit("quiz:time_up");
        }

        socket.emit("quiz:error", { message: "Time is over" });
        return;
      }

      await player.update({
        status: "FINISHED",
        finished_at: new Date(),
      });

      const remaining = await GameSessionPlayer.count({
        where: {
          session_id: sessionId,
          status: { [Op.ne]: "FINISHED" },
        },
      });

      io.to(`quiz:${sessionId}`).emit(
        remaining === 0 ? "quiz:all_finished" : "quiz:waiting"
      );
    });
     
    /**
     * PLAYER SUBMITS ANSWER
     */
socket.on("quiz:answer", async ({ sessionId, questionId, selectedIndex }) => {
  const player = await GameSessionPlayer.findOne({
    where: {
      session_id: sessionId,
      user_id: socket.user.id,
    },
  });

  if (!player || player.status === "FINISHED") return;

  const session = await GameSession.findByPk(sessionId);
  if (!session) return;

  if (!session.started_at) {
    socket.emit("quiz:error", { message: "Quiz not started yet" });
    return;
  }

  if (isTimeOver(session)) {
    if (session.status !== "FINISHED") {
      await session.update({ status: "FINISHED" });
      io.to(`quiz:${sessionId}`).emit("quiz:time_up");
    }
    socket.emit("quiz:error", { message: "Time is over" });
    return;
  }

  const existingAnswer = await PlayerAnswer.findOne({
    where: {
      session_player_id: player.id,
      question_id: questionId,
    },
  });

  if (existingAnswer) {
    socket.emit("quiz:error", { message: "Already answered" });
    return;
  }

  const question = await QuizQuestion.findByPk(questionId);
  if (!question) return;

  const isCorrect =
    question.correct_option_index === selectedIndex;

  await sequelize.transaction(async (t) => {
    await PlayerAnswer.create(
      {
        session_player_id: player.id,
        question_id: questionId,
        selected_option_index: selectedIndex,
        is_correct: isCorrect,
      },
      { transaction: t }
    );

    if (isCorrect) {
      await player.increment("score", { by: 1, transaction: t });
    }
  });

  socket.emit("quiz:answer_ack", {
    questionId,
    isCorrect,
  });
});


    /**
     * HANDLE DISCONNECT
     */
    socket.on("disconnect", async () => {
      await GameSessionPlayer.update(
        { status: "DISCONNECTED" },
        { where: { socket_id: socket.id } }
      );
    });



  });
}
