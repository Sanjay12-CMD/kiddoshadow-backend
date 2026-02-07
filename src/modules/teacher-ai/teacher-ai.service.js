import { GoogleGenerativeAI } from "@google/generative-ai";
import AppError from "../../shared/appError.js";
import AiChatLog from "../ai-chat-logs/ai-chat-log.model.js";
import { deductTokens } from "../tokens/token.service.js";
import { PROMPTS } from "./teacher-ai.prompts.js";
import { retrieveRagContext, formatRagSources } from "../rag/rag.service.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const GEMINI_MODEL = process.env.GEMINI_MODEL ;

const chatModel = genAI.getGenerativeModel({
  model: GEMINI_MODEL,
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

  // 🧠 Build prompt (ensure subject fallback for legacy templates)
  const safePayload = { subject: "General", ...payload };
  let prompt = promptBuilder(safePayload);

  // 🔍 Optional RAG context (for lesson summary / question paper / homework / quiz)
  let sourceType = "gemini";
  let sources = [];
  let filtersUsed = null;

  const ragQuery = payload?.topic || payload?.chapter;
  const hasScope = payload?.classLevel;

  if (ragQuery && hasScope) {
    const context = await retrieveRagContext({
      query: ragQuery,
      classLevel: payload.classLevel,
      allowGlobal: true,
    });

    filtersUsed = context.filter;

    if (context.chunks.length) {
      const ragText = context.chunks.join("\n\n");
      prompt = `
${prompt}

Use the textbook context below first. If it is insufficient, you may add general knowledge.

Textbook context:
${ragText}
`;

      sourceType = "rag";
      sources = formatRagSources(context.metadatas);
    }
  }

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
      model_used: GEMINI_MODEL,
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

  return {
    text: output,
    source_type: sourceType,
    sources,
    filters_used: filtersUsed,
  };
}
