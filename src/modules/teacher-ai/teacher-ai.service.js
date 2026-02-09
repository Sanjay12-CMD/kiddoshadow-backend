import { GoogleGenAI } from "@google/genai";
import AppError from "../../shared/appError.js";
import AiChatLog from "../ai-chat-logs/ai-chat-log.model.js";
import { deductTokens } from "../tokens/token.service.js";
import { PROMPTS } from "./teacher-ai.prompts.js";
import { retrieveRagContext, formatRagSources } from "../rag/rag.service.js";

const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.5-flash-lite").replace(/^models\//, "");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

  // 🔍 Optional RAG context
  let sourceType = "gemini";
  let sources = [];
  let filtersUsed = null;
  const requireRag = new Set(["lesson_summary", "question_paper"]);

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

Use ONLY the textbook context below. If it is insufficient, say "I don't know."

Textbook context:
${ragText}
`;

      sourceType = "rag";
      sources = formatRagSources(context.metadatas);
    } else if (requireRag.has(aiType)) {
      // Strict RAG-only for lesson summary & question paper
      return {
        text: "I don't know.",
        source_type: "none",
        sources: [],
        filters_used: filtersUsed,
      };
    }
  } else if (requireRag.has(aiType)) {
    return {
      text: "I don't know.",
      source_type: "none",
      sources: [],
      filters_used: null,
    };
  }

  // 🤖 Call Gemini
  const result = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });

  const usage = result.usageMetadata || {};
  const tokensUsed = usage.totalTokenCount || 0;
  const output =
    result.text ||
    result?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
    "";

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
