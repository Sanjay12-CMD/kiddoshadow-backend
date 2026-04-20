import { GoogleGenAI } from "@google/genai";
import { Op, fn, col, where } from "sequelize";
import { buildQuizPrompt } from "./quiz-rag.prompts.js";
import Quiz from "./quiz.model.js";
import QuizQuestion from "./quiz-question.model.js";
import GameSession from "../game/game-session.model.js";
import GameSessionPlayer from "../game/game-session-player.model.js";
import PlayerAnswer from "../game/player-answer.model.js";
import AppError from "../../shared/appError.js";

const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.5-flash-lite").replace(/^models\//, "");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function isQuotaError(err) {
  const status = Number(err?.status || err?.code || err?.error?.code || 0);
  const msg = String(err?.message || "").toLowerCase();
  return (
    status === 429 ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota exceeded") ||
    msg.includes("rate limit")
  );
}

function fallbackQuizQuestions(topic, classLevel, count) {
  const safeClass = classLevel || "school";
  const safeCount = Math.min(Math.max(count || 5, 1), 20);

  const rotate = (arr, by) => {
    const n = ((by % arr.length) + arr.length) % arr.length;
    return arr.slice(n).concat(arr.slice(0, n));
  };

  const makeQuestion = (questionText, correct, wrongA, wrongB, wrongC, seed) => {
    const options = rotate([correct, wrongA, wrongB, wrongC], seed % 4);
    const correctIndex = options.findIndex((o) => o === correct);
    return {
      question_text: questionText,
      options,
      correct_option_index: correctIndex < 0 ? 0 : correctIndex,
    };
  };

  const topicLc = String(topic || "").toLowerCase();
  const isMathLike = /(algebra|geometry|equation|fraction|ratio|decimal|percent|trigonometry|calculus)/i.test(topicLc);
  const isScienceLike = /(photosynthesis|atom|cell|force|energy|electric|gravity|plant|human body|ecosystem|chemical|physics|biology|chemistry)/i.test(topicLc);

  const templateFactories = [
    (seed) => makeQuestion(
      `What best defines "${topic}" for Class ${safeClass}?`,
      `"${topic}" is an important concept taught for Class ${safeClass}.`,
      `"${topic}" is unrelated to school learning outcomes.`,
      `"${topic}" means avoiding textbook concepts.`,
      `"${topic}" cannot be explained in simple classroom language.`,
      seed
    ),
    (seed) => makeQuestion(
      `Which classroom activity best helps learn "${topic}"?`,
      `Practicing examples and discussing key ideas of ${topic}.`,
      `Skipping concept understanding and memorizing random facts.`,
      `Ignoring teacher explanations and doing no revision.`,
      `Avoiding diagrams, examples, and concept mapping.`,
      seed
    ),
    (seed) => makeQuestion(
      `Why is "${topic}" important for students?`,
      `It improves conceptual understanding and problem-solving ability.`,
      `It only helps in guessing answers without understanding.`,
      `It is useful only outside academics and never in exams.`,
      `It has no relation to real-world or curriculum learning.`,
      seed
    ),
    (seed) => makeQuestion(
      `Which statement about "${topic}" is TRUE?`,
      `${topic} can be learned step-by-step using examples and revision.`,
      `${topic} cannot be learned unless advanced college methods are used.`,
      `${topic} should be avoided in school-level study plans.`,
      `${topic} has no foundational concepts to understand.`,
      seed
    ),
    (seed) => makeQuestion(
      `What should a student do first while studying "${topic}"?`,
      `Understand core terms and basic ideas before harder questions.`,
      `Start with hardest questions without concept revision.`,
      `Focus only on final answers and skip reasoning.`,
      `Avoid class notes and rely only on guesswork.`,
      seed
    ),
    (seed) => makeQuestion(
      `Which habit most improves long-term learning in "${topic}"?`,
      `Regular revision with examples, notes, and self-checks.`,
      `Studying only the night before the exam.`,
      `Skipping corrections after making mistakes.`,
      `Reading answers without understanding the concepts.`,
      seed
    ),
    (seed) => makeQuestion(
      `A student is confused in "${topic}". What is the best next step?`,
      `Review the basic idea, solve one example, and then try again.`,
      `Memorize random options without reading the question.`,
      `Avoid asking for help and leave the topic fully.`,
      `Skip to unrelated lessons without understanding the base idea.`,
      seed
    ),
    (seed) => makeQuestion(
      `Which study method is weakest for mastering "${topic}"?`,
      `Guessing answers without understanding why they are correct.`,
      `Reviewing class notes and textbook examples.`,
      `Practicing questions from easy to hard.`,
      `Checking mistakes and learning the corrected method.`,
      seed
    ),
    (seed) => makeQuestion(
      `What is a good sign that a student understands "${topic}"?`,
      `They can explain the idea and apply it to a fresh example.`,
      `They can only repeat one answer by heart.`,
      `They avoid all practice questions on the topic.`,
      `They rely on chance for every answer.`,
      seed
    ),
    (seed) => makeQuestion(
      `Which revision plan is most useful before a "${topic}" quiz?`,
      `Review key rules, practice mixed questions, and check mistakes.`,
      `Read only headings and skip every example.`,
      `Memorize one answer pattern for every question.`,
      `Avoid solving anything until the exam starts.`,
      seed
    ),
  ];

  if (isMathLike) {
    templateFactories.push(
      (seed) => makeQuestion(
        `In ${topic}, what improves accuracy the most?`,
        `Solving step-by-step and checking each intermediate step.`,
        `Skipping steps to finish faster.`,
        `Ignoring units or signs and focusing only on the final number.`,
        `Avoiding practice of varied problem types.`,
        seed
      ),
      (seed) => makeQuestion(
        `When solving a ${topic} problem, what should be checked at the end?`,
        `Whether each step follows the rule correctly and the answer is reasonable.`,
        `Only whether the page looks full enough.`,
        `Whether the numbers were copied without thinking.`,
        `Only whether the final line is underlined.`,
        seed
      )
    );
  }

  if (isScienceLike) {
    templateFactories.push(
      (seed) => makeQuestion(
        `For "${topic}", which approach gives better understanding?`,
        `Using diagrams, cause-effect links, and real-life examples.`,
        `Memorizing isolated lines without context.`,
        `Ignoring process flow and key terminology.`,
        `Avoiding textbook explanations and teacher discussion.`,
        seed
      ),
      (seed) => makeQuestion(
        `Which science skill best supports learning "${topic}"?`,
        `Observing patterns and linking them to the concept clearly.`,
        `Ignoring vocabulary and process steps.`,
        `Remembering one sentence without meaning.`,
        `Skipping experiments, diagrams, and examples.`,
        seed
      )
    );
  }

  const rows = templateFactories.map((factory, index) => factory(index));
  const targetCount = Math.max(safeCount * 3, 12);

  while (rows.length < targetCount) {
    const seed = rows.length;
    rows.push(
      makeQuestion(
        `Which statement best applies "${topic}" in classroom situation ${seed - templateFactories.length + 1}?`,
        `It uses the main idea of ${topic} correctly and logically.`,
        `It ignores the concept of ${topic} completely.`,
        `It depends on guessing instead of understanding.`,
        `It avoids checking whether the idea is correct.`,
        seed
      )
    );
  }

  return rows;
}

function normalizeQuestionText(text = "") {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function getPreviouslyAskedQuestionTexts({ userId, topic }) {
  if (!userId || !String(topic || "").trim()) {
    return [];
  }

  const priorQuizzes = await Quiz.findAll({
    where: {
      owner_user_id: userId,
      [Op.and]: [where(fn("lower", col("topic")), String(topic).trim().toLowerCase())],
    },
    attributes: ["id"],
    order: [["created_at", "DESC"]],
    limit: 20,
  });

  const quizIds = priorQuizzes.map((quiz) => quiz.id).filter(Boolean);
  if (!quizIds.length) {
    return [];
  }

  const priorQuestions = await QuizQuestion.findAll({
    where: { quiz_id: { [Op.in]: quizIds } },
    attributes: ["question_text"],
    order: [["created_at", "DESC"]],
    limit: 100,
  });

  return Array.from(
    new Set(
      priorQuestions
        .map((question) => String(question.question_text || "").trim())
        .filter(Boolean)
    )
  );
}

function dedupeQuestions(questions = [], blockedQuestionTexts = []) {
  const blocked = new Set(blockedQuestionTexts.map((text) => normalizeQuestionText(text)));
  const seen = new Set();
  const unique = [];

  for (const question of questions) {
    const normalized = normalizeQuestionText(question?.question_text || question?.question);
    if (!normalized || blocked.has(normalized) || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    unique.push(question);
  }

  return unique;
}

function buildQuestionReview(question, selectedIndex) {
  const selectedOptionIndex =
    typeof selectedIndex === "number" ? selectedIndex : null;
  const correctOptionIndex =
    typeof question.correct_option_index === "number"
      ? question.correct_option_index
      : null;

  return {
    questionId: question.id,
    questionText: question.question_text,
    options: Array.isArray(question.options) ? question.options : [],
    selectedOptionIndex,
    correctOptionIndex,
    selectedAnswer:
      selectedOptionIndex !== null ? question.options?.[selectedOptionIndex] ?? null : null,
    correctAnswer:
      correctOptionIndex !== null ? question.options?.[correctOptionIndex] ?? null : null,
    isCorrect:
      selectedOptionIndex !== null &&
      correctOptionIndex !== null &&
      selectedOptionIndex === correctOptionIndex,
  };
}

function fillMissingQuestions({
  questions,
  topic,
  classLevel,
  count,
  blockedQuestionTexts = [],
}) {
  if (questions.length >= count) {
    return questions.slice(0, count);
  }

  const fallbackRows = fallbackQuizQuestions(topic, classLevel, Math.max(count * 3, 10));
  const remaining = dedupeQuestions(
    fallbackRows,
    blockedQuestionTexts.concat(questions.map((question) => question.question_text || question.question))
  );

  return questions.concat(remaining).slice(0, count);
}

function extractJson(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new AppError("AI returned invalid quiz format", 502);
  }
  const jsonText = cleaned.slice(start, end + 1);
  return JSON.parse(jsonText);
}

export async function generateQuizFromAi({
  user,
  topic,
  classLevel,
  difficulty,
  numQuestions,
}) {
  const safeNumQuestions = Math.min(Math.max(numQuestions || 5, 1), 20);
  const safeDifficulty = difficulty || "MEDIUM";
  const safeClassLevel = classLevel || 5;
  const previouslyAskedQuestionTexts = await getPreviouslyAskedQuestionTexts({
    userId: user?.id,
    topic,
  });

  const prompt = buildQuizPrompt({
    topic,
    classLevel: safeClassLevel,
    difficulty: safeDifficulty,
    numQuestions: safeNumQuestions,
    excludedQuestionTexts: previouslyAskedQuestionTexts.slice(0, 30),
  });

  let result;
  try {
    result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
  } catch (err) {
    if (!isQuotaError(err)) {
      throw new AppError("Failed to generate quiz from AI", 502);
    }

    // Gemini quota exceeded: fallback to local quiz generation so API does not fail with 500.
    const fallbackRows = fillMissingQuestions({
      questions: [],
      topic,
      classLevel: safeClassLevel,
      count: safeNumQuestions,
      blockedQuestionTexts: previouslyAskedQuestionTexts,
    });
    if (fallbackRows.length < safeNumQuestions) {
      throw new AppError("Could not generate enough new quiz questions for this topic", 409);
    }
    const quiz = await Quiz.create({
      title: `${topic} Quiz`,
      topic,
      difficulty: safeDifficulty,
      num_questions: fallbackRows.length,
      owner_user_id: user.id,
    });

    const createdQuestions = await QuizQuestion.bulkCreate(
      fallbackRows.map((q, i) => ({
        quiz_id: quiz.id,
        order_index: i,
        question_text: q.question_text,
        options: q.options,
        correct_option_index: q.correct_option_index,
      })),
      { returning: true }
    );

    return {
      quizId: quiz.id,
      questions: createdQuestions,
    };
  }
  const text =
    result.text ||
    result?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
    "";

  let parsed;
  try {
    parsed = extractJson(text);
  } catch {
    throw new AppError("AI returned invalid quiz format", 502);
  }

  if (!parsed?.questions || !Array.isArray(parsed.questions)) {
    throw new AppError("AI returned invalid quiz format", 502);
  }

  const preparedQuestions = fillMissingQuestions({
    questions: dedupeQuestions(parsed.questions, previouslyAskedQuestionTexts),
    topic,
    classLevel: safeClassLevel,
    count: safeNumQuestions,
    blockedQuestionTexts: previouslyAskedQuestionTexts,
  });
  if (preparedQuestions.length < safeNumQuestions) {
    throw new AppError("Could not generate enough new quiz questions for this topic", 409);
  }

  const quiz = await Quiz.create({
    title: parsed.title || topic,
    topic,
    difficulty: safeDifficulty,
    num_questions: preparedQuestions.length,
    owner_user_id: user.id,
  });

  const questionRows = preparedQuestions.map((q, i) => ({
    quiz_id: quiz.id,
    order_index: i,
    question_text: q.question_text || q.question,
    options: q.options,
    correct_option_index:
      q.correct_option_index !== undefined
        ? q.correct_option_index
        : q.correct_index,
  }));

  const createdQuestions = await QuizQuestion.bulkCreate(questionRows, {
    returning: true,
  });

  return {
    quizId: quiz.id,
    questions: createdQuestions,
  };
}

export async function getSinglePlayerQuizReview({ sessionId, user }) {
  const session = await GameSession.findByPk(sessionId, {
    include: [{ model: Quiz, attributes: ["id", "title", "topic"] }],
  });

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  const player = await GameSessionPlayer.findOne({
    where: {
      session_id: sessionId,
      user_id: user.id,
    },
  });

  const isHostTeacher =
    user?.role === "teacher" && String(session.host_user_id) === String(user.id);

  if (!player && !isHostTeacher) {
    throw new AppError("Forbidden", 403);
  }

  if (session.mode !== "SINGLE") {
    throw new AppError("Detailed review is available only for single-player quizzes", 400);
  }

  const questions = await QuizQuestion.findAll({
    where: { quiz_id: session.quiz_id },
    order: [["order_index", "ASC"]],
  });

  const playerAnswers = player
    ? await PlayerAnswer.findAll({
        where: { session_player_id: player.id },
        order: [["created_at", "ASC"]],
      })
    : [];

  const answerMap = new Map(
    playerAnswers.map((answer) => [String(answer.question_id), answer.selected_option_index])
  );

  const review = questions.map((question) =>
    buildQuestionReview(question, answerMap.has(String(question.id)) ? answerMap.get(String(question.id)) : null)
  );

  const score = review.filter((item) => item.isCorrect).length;

  return {
    sessionId: session.id,
    mode: session.mode,
    quizId: session.quiz_id,
    quizTitle: session.Quiz?.title || session.Quiz?.topic || "Quiz",
    topic: session.Quiz?.topic || null,
    playerId: player?.id || null,
    score,
    total: review.length,
    review,
  };
}
