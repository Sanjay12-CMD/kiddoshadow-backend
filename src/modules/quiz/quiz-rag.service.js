import { GoogleGenAI } from "@google/genai";
import { buildQuizPrompt } from "./quiz-rag.prompts.js";
import Quiz from "./quiz.model.js";
import QuizQuestion from "./quiz-question.model.js";
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

  const base = [
    makeQuestion(
      `What best defines "${topic}"?`,
      `"${topic}" is an important concept taught for Class ${safeClass}.`,
      `"${topic}" is unrelated to school learning outcomes.`,
      `"${topic}" means avoiding textbook concepts.`,
      `"${topic}" cannot be explained in simple classroom language.`,
      0
    ),
    makeQuestion(
      `Which classroom activity best helps learn "${topic}"?`,
      `Practicing examples and discussing key ideas of ${topic}.`,
      `Skipping concept understanding and memorizing random facts.`,
      `Ignoring teacher explanations and doing no revision.`,
      `Avoiding diagrams, examples, and concept mapping.`,
      1
    ),
    makeQuestion(
      `Why is "${topic}" important for students?`,
      `It improves conceptual understanding and problem-solving ability.`,
      `It only helps in guessing answers without understanding.`,
      `It is useful only outside academics and never in exams.`,
      `It has no relation to real-world or curriculum learning.`,
      2
    ),
    makeQuestion(
      `Which statement about "${topic}" is TRUE?`,
      `${topic} can be learned step-by-step using examples and revision.`,
      `${topic} cannot be learned unless advanced college methods are used.`,
      `${topic} should be avoided in school-level study plans.`,
      `${topic} has no foundational concepts to understand.`,
      3
    ),
    makeQuestion(
      `What should a student do first while studying "${topic}"?`,
      `Understand core terms and basic ideas before harder questions.`,
      `Start with hardest questions without concept revision.`,
      `Focus only on final answers and skip reasoning.`,
      `Avoid class notes and rely only on guesswork.`,
      4
    ),
  ];

  if (isMathLike) {
    base.push(
      makeQuestion(
        `In ${topic}, what improves accuracy the most?`,
        `Solving step-by-step and checking each intermediate step.`,
        `Skipping steps to finish faster.`,
        `Ignoring units/signs and focusing only on final number.`,
        `Avoiding practice of varied problem types.`,
        5
      )
    );
  }

  if (isScienceLike) {
    base.push(
      makeQuestion(
        `For "${topic}", which approach gives better understanding?`,
        `Using diagrams, cause-effect links, and real-life examples.`,
        `Memorizing isolated lines without context.`,
        `Ignoring process flow and key terminology.`,
        `Avoiding textbook explanations and teacher discussion.`,
        6
      )
    );
  }

  const rows = [];
  for (let i = 0; i < safeCount; i++) {
    rows.push(base[i % base.length]);
  }

  return rows;
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

  const prompt = buildQuizPrompt({
    topic,
    classLevel: safeClassLevel,
    difficulty: safeDifficulty,
    numQuestions: safeNumQuestions,
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
    const fallbackRows = fallbackQuizQuestions(topic, safeClassLevel, safeNumQuestions);
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

  const quiz = await Quiz.create({
    title: parsed.title || topic,
    topic,
    difficulty: safeDifficulty,
    num_questions: parsed.questions.length,
    owner_user_id: user.id,
  });

  const questionRows = parsed.questions.map((q, i) => ({
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
