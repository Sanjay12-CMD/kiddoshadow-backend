import { ChromaClient } from "chromadb";
import AiChatLog from "../ai-chat-logs/ai-chat-log.model.js";
import { deductTokens } from "../tokens/token.service.js";

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const COLLECTION_NAME = "cbse_books";

// Chroma setup
const chromaUrl = new URL(
  CHROMA_URL.startsWith("http") ? CHROMA_URL : `http://${CHROMA_URL}`
);
const chroma = new ChromaClient({
  host: chromaUrl.hostname,
  port: chromaUrl.port
    ? Number(chromaUrl.port)
    : chromaUrl.protocol === "https:"
    ? 443
    : 80,
  ssl: chromaUrl.protocol === "https:",
});

const normalizeClassLevel = (value) => {
  if (!value) return null;
  const str = String(value).trim().toLowerCase();
  const digitMatch = str.match(/\d+/);
  if (digitMatch) return digitMatch[0];
  return str.replace(/^class\s*/, "");
};

const buildStrictBookAnswer = (chunks) => {
  const sentences = String(chunks.join(" "))
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 20);

  const top = sentences.slice(0, 6);
  if (!top.length) return null;

  return `Textbook Answer:\n${top.map((line) => `- ${line}`).join("\n")}`;
};

export const formatRagSources = (metadatas) => {
  if (!Array.isArray(metadatas)) return [];
  return [
    ...new Set(
      metadatas.map((m) => {
        const title = m.chapter || m.book || "Source";
        return `Class ${m.class} - ${title}`;
      })
    ),
  ];
};

export async function retrieveRagContext({
  query,
  classLevel,
  allowGlobal = true,
}) {
  try {
    const normalizedClass = normalizeClassLevel(classLevel);
    const collection = await chroma.getCollection({
      name: COLLECTION_NAME,
    });

    let results = await collection.query({
      queryTexts: [query],
      nResults: 5,
      ...(normalizedClass ? { where: { class: normalizedClass } } : {}),
    });

    if (
      (!results?.documents || !results.documents.flat().length) &&
      normalizedClass &&
      allowGlobal
    ) {
      results = await collection.query({
        queryTexts: [query],
        nResults: 5,
      });
    }

    return {
      chunks: (results.documents || []).flat(),
      metadatas: (results.metadatas || []).flat(),
      filter: normalizedClass ? "class_filtered" : "global",
      classLevel: normalizedClass,
      chromaAvailable: true,
    };
  } catch (err) {
    // Chroma unavailable
    return {
      chunks: [],
      metadatas: [],
      filter: "chroma_unavailable",
      classLevel: normalizeClassLevel(classLevel),
      chromaAvailable: false,
    };
  }
}

export async function askRag({ question, classLevel, userId }) {
  const context = await retrieveRagContext({
    query: question,
    classLevel,
    allowGlobal: true,
  });

  const chunks = context.chunks;

  let answer;
  let tokensUsed = 0;
  let usedFilter = context.filter;
  let finalChunks = chunks;
  let finalMetadatas = context.metadatas;
  let billingWarning = null;

  if (!chunks.length) {
    answer =
      "I could not find this answer in the uploaded textbook content. Please ask from the ingested book PDF.";
    usedFilter = context.chromaAvailable ? "rag_no_match" : "chroma_unavailable";
  }

  if (finalChunks.length && !answer) {
    const strict = buildStrictBookAnswer(finalChunks);
    answer = strict || "I don't know";
    tokensUsed = 0;
  }

  let log = null;
  if (userId) {
    // 🔹 Log AI usage
    log = await AiChatLog.create({
      user_id: userId,
      user_query: question,
      ai_response: answer,
      tokens_used: tokensUsed,
      model_used: "chroma_semantic",
      ai_type: "rag",
      class_level: classLevel ?? null,
    });

    // 🔹 Deduct tokens (only if tokens used)
    if (tokensUsed > 0) {
      try {
        await deductTokens({
          userId,
          amount: tokensUsed,
          reason: "rag",
          refId: log.id,
        });
      } catch (err) {
        // Keep answer successful even when billing/subscription blocks deduction.
        billingWarning = err?.message || "Token deduction failed";
      }
    }
  }

  return {
    answer,
    sources: formatRagSources(finalMetadatas),
    source_type: finalChunks.length ? "rag" : "rag_no_match",
    filters_used: usedFilter,
    ...(billingWarning ? { billing_warning: billingWarning } : {}),
  };
}
