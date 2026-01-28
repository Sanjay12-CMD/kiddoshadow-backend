import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildQuizPrompt } from "./quiz-rag.prompts.js";
import Quiz from "./quiz.model.js";
import QuizQuestion from "./quiz-question.model.js";
import { askRagContext } from "../rag/rag.context.js"; // context-only retriever
import AppError from "../../shared/appError.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const chatModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateQuizFromRag({
  user,
  topic,
  classLevel,
  difficulty,
  numQuestions,
  topicId,
}) {
  // 1️⃣ Get CBSE context only (no answer generation)
  const context = await askRagContext({
    topic,
    classLevel,
    limit: 10,
  });

  if (!context) {
    throw new AppError("Insufficient textbook content", 400);
  }

  // 2️⃣ Build prompt
  const prompt = buildQuizPrompt({
    topic,
    classLevel,
    difficulty,
    numQuestions,
    context,
  });

  // 3️⃣ Call Gemini
  const result = await chatModel.generateContent(prompt);
  const text = result.response.text();

  // 4️⃣ Parse JSON strictly
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new AppError("AI returned invalid quiz format", 500);
  }

  // 5️⃣ Save quiz
  const quiz = await Quiz.create({
    title: parsed.title,
    topic_id: topicId,
    difficulty,
    num_questions: parsed.questions.length,
    owner_user_id: user.id,
  });

  // 6️⃣ Save questions
  for (let i = 0; i < parsed.questions.length; i++) {
    const q = parsed.questions[i];
    await QuizQuestion.create({
      quiz_id: quiz.id,
      order_index: i,
      question_text: q.question,
      options: q.options,
      correct_option_index: q.correct_index,
    });
  }

  return quiz.id;
}
