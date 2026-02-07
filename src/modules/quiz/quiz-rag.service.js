import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildQuizPrompt } from "./quiz-rag.prompts.js";
import Quiz from "./quiz.model.js";
import QuizQuestion from "./quiz-question.model.js";
import AppError from "../../shared/appError.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const chatModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

function extractJson(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new AppError("AI returned invalid quiz format", 500);
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

  const result = await chatModel.generateContent(prompt);
  const text = result.response.text();

  let parsed;
  try {
    parsed = extractJson(text);
  } catch {
    throw new AppError("AI returned invalid quiz format", 500);
  }

  if (!parsed?.questions || !Array.isArray(parsed.questions)) {
    throw new AppError("AI returned invalid quiz format", 500);
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
