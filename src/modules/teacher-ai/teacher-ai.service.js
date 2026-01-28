import { GoogleGenerativeAI } from "@google/generative-ai";
import AppError from "../../shared/appError.js";
import AiChatLog from "../ai-chat-logs/ai-chat-log.model.js";
import { deductTokens } from "../tokens/token.service.js";
import { PROMPTS } from "./teacher-ai.prompts.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chatModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export async function runTeacherAI({ user, aiType, payload }) {
  // 🔒 Role check (extra safety, even though route already restricts)
  if (user.role !== "teacher") {
    throw new AppError("Only teachers can use this AI feature", 403);
  }

  // 🔍 Validate AI task
  const promptBuilder = PROMPTS[aiType];
  if (!promptBuilder) {
    throw new AppError("Invalid teacher AI task", 400);
  }

  // 🧠 Build prompt
  const prompt = promptBuilder(payload);

  // 🤖 Call Gemini
  const result = await chatModel.generateContent(prompt);

  const usage = result.response.usageMetadata || {};
  const tokensUsed = usage.totalTokenCount || 0;
  const output = result.response.text();

  // 📝 Log AI usage
  const log = await AiChatLog.create({
    user_id: user.id,
    user_query: JSON.stringify(payload),
    ai_response: output,
    tokens_used: tokensUsed,
    model_used: "gemini-1.5-flash",
    ai_type: aiType,
    class_level: payload.classLevel ?? null,
  });

  // 💰 Deduct tokens
  if (tokensUsed > 0) {
    await deductTokens({
      userId: user.id,
      amount: tokensUsed,
      reason: aiType,
      refId: log.id,
    });
  }

  return output;
}
