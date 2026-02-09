import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import GameSession from "../modules/game/game-session.model.js";
import GameSessionPlayer from "../modules/game/game-session-player.model.js";
import { isTimeOver } from "../modules/game/game.utils.js";
import PlayerAnswer from "../modules/game/player-answer.model.js";
import QuizQuestion from "../modules/quiz/quiz-question.model.js";
import db from "../config/db.js";

const sessionState = new Map();

function sanitizeQuestion(question) {
  return {
    id: question.id,
    question_text: question.question_text,
    options: question.options,
  };
}


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

  const endSession = async (sessionId) => {
    const state = sessionState.get(sessionId);
    if (state?.timerId) {
      clearTimeout(state.timerId);
    }
    sessionState.delete(sessionId);

    const session = await GameSession.findByPk(sessionId);
    if (session && session.status !== "FINISHED") {
      await session.update({ status: "FINISHED", ended_at: new Date() });
    }

    io.to(`quiz:${sessionId}`).emit("quiz:finished");
    io.to(`quiz:${sessionId}`).emit("quiz:all_finished");
  };

  const emitQuestion = (sessionId) => {
    const state = sessionState.get(sessionId);
    if (!state) return;

    const { questions, currentIndex, perQuestionMs } = state;
    if (currentIndex >= questions.length) {
      endSession(sessionId);
      return;
    }

    state.questionSentAt = Date.now();
    sessionState.set(sessionId, state);

    io.to(`quiz:${sessionId}`).emit("quiz:question", {
      question: sanitizeQuestion(questions[currentIndex]),
      questionIndex: currentIndex,
      totalQuestions: questions.length,
      timeLimit: perQuestionMs,
    });

    state.timerId = setTimeout(() => {
      const nextState = sessionState.get(sessionId);
      if (!nextState) return;
      nextState.currentIndex += 1;
      sessionState.set(sessionId, nextState);
      emitQuestion(sessionId);
    }, perQuestionMs);
  };

  const startQuestionFlow = (sessionId, questions, perQuestionMs) => {
    sessionState.set(sessionId, {
      questions,
      perQuestionMs,
      currentIndex: 0,
      questionSentAt: Date.now(),
      timerId: null,
    });
    emitQuestion(sessionId);
  };

  io.on("connection", (socket) => {

    /**
     * JOIN QUIZ ROOM
     */
    socket.on("quiz:join", async ({ sessionId }) => {
      // 1️⃣ HOST CHECK
      const session = await GameSession.findByPk(sessionId);

      // Teacher host joins as observer only (no player record)
      if (session && session.host_user_id === socket.user.id && socket.user.role === "teacher") {
        socket.join(`quiz:${sessionId}`);
        socket.emit("quiz:joined", {
          sessionId,
          playerId: null,
          status: session.status,
          isHost: true
        });
        const state = sessionState.get(sessionId);
        if (session.status === "IN_PROGRESS" && state?.questions?.length) {
          const timeLeft = Math.max(
            0,
            state.perQuestionMs - (Date.now() - state.questionSentAt)
          );
          socket.emit("quiz:question", {
            question: sanitizeQuestion(state.questions[state.currentIndex]),
            questionIndex: state.currentIndex,
            totalQuestions: state.questions.length,
            timeLimit: timeLeft,
          });
        }
        return;
      }

      // 2️⃣ STUDENT / PLAYER CHECK (includes student host)
      let player = await GameSessionPlayer.findOne({
        where: {
          session_id: sessionId,
          user_id: socket.user.id,
        },
      });

      if (!player) {
        player = await GameSessionPlayer.create({
          session_id: sessionId,
          user_id: socket.user.id,
          is_host: session?.host_user_id === socket.user.id,
          status: "JOINED",
        });
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
        isHost: false // Student is not host (usually)
      });

      const state = sessionState.get(sessionId);
      if (session?.status === "IN_PROGRESS" && state?.questions?.length) {
        const timeLeft = Math.max(
          0,
          state.perQuestionMs - (Date.now() - state.questionSentAt)
        );
        socket.emit("quiz:question", {
          question: sanitizeQuestion(state.questions[state.currentIndex]),
          questionIndex: state.currentIndex,
          totalQuestions: state.questions.length,
          timeLimit: timeLeft,
        });
      }
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

      const questions = await QuizQuestion.findAll({
        where: { quiz_id: session.quiz_id },
        order: [["order_index", "ASC"]],
      });

      if (!questions.length) {
        io.to(`quiz:${sessionId}`).emit("quiz:error", {
          message: "No questions available for this quiz",
        });
        return;
      }

      const perQuestionMs = Math.max(
        5000,
        Math.floor((session.total_time_ms || 0) / questions.length) || 30000
      );

      startQuestionFlow(sessionId, questions, perQuestionMs);
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
        await endSession(sessionId);
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

      if (remaining === 0) {
        await endSession(sessionId);
      } else {
        io.to(`quiz:${sessionId}`).emit("quiz:waiting");
      }
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
        await endSession(sessionId);
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

      await db.transaction(async (t) => {
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

      // If all active players answered this question, advance immediately
      try {
        const state = sessionState.get(sessionId);
        if (state && state.questions?.[state.currentIndex]?.id == questionId) {
          const activePlayers = await GameSessionPlayer.findAll({
            where: {
              session_id: sessionId,
              status: { [Op.notIn]: ["FINISHED", "DISCONNECTED"] },
            },
            attributes: ["id"],
          });
          const activeIds = activePlayers.map((p) => p.id);

          if (activeIds.length > 0) {
            const answeredCount = await PlayerAnswer.count({
              where: {
                question_id: questionId,
                session_player_id: { [Op.in]: activeIds },
              },
            });

            if (answeredCount >= activeIds.length) {
              if (state.timerId) {
                clearTimeout(state.timerId);
              }
              state.currentIndex += 1;
              sessionState.set(sessionId, state);
              emitQuestion(sessionId);
            }
          }
        }
      } catch {
        // ignore early-advance errors
      }
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
