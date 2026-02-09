import { ChromaClient } from "chromadb";
import { GoogleGenAI } from "@google/genai";
import AiChatLog from "../ai-chat-logs/ai-chat-log.model.js";
import { deductTokens } from "../tokens/token.service.js";

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const COLLECTION_NAME = "cbse_books";

// Gemini setup
const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.5-flash-lite").replace(/^models\//, "");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

const STOPWORDS = new Set([
  "the",
  "and",
  "or",
  "of",
  "to",
  "a",
  "an",
  "in",
  "on",
  "for",
  "with",
  "about",
  "tell",
  "what",
  "is",
  "are",
  "was",
  "were",
  "do",
  "does",
  "did",
  "i",
  "you",
  "we",
  "they",
  "he",
  "she",
  "it",
]);

const extractKeywords = (text) => {
  const words = String(text || "")
    .toLowerCase()
    .match(/[a-z0-9]+/g);
  if (!words) return [];
  return words.filter((w) => w.length >= 4 && !STOPWORDS.has(w));
};

const keywordSearch = async ({ collection, query, limit = 5 }) => {
  const keywords = extractKeywords(query);
  if (!keywords.length) {
    return { chunks: [], metadatas: [] };
  }

  // Fetch all docs (small dataset) and score by keyword hits
  const all = await collection.get({
    limit: 10000,
    include: ["documents", "metadatas"],
  });

  const scored = [];
  for (let i = 0; i < (all.documents || []).length; i++) {
    const doc = all.documents[i] || "";
    const lower = doc.toLowerCase();
    let score = 0;
    for (const k of keywords) {
      if (lower.includes(k)) score += 1;
    }
    if (score > 0) {
      scored.push({ doc, meta: all.metadatas?.[i] || null, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, limit);

  return {
    chunks: top.map((t) => t.doc),
    metadatas: top.map((t) => t.meta),
  };
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
  const collection = await chroma.getCollection({
    name: COLLECTION_NAME,
  });

  const results = await collection.query({
    queryTexts: [query],
    nResults: 5,
  });

  return {
    chunks: results.documents.flat(),
    metadatas: results.metadatas.flat(),
    filter: "global",
    classLevel: normalizeClassLevel(classLevel),
  };
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

  if (!chunks.length) {
    const collection = await chroma.getCollection({ name: COLLECTION_NAME });
    const keyword = await keywordSearch({
      collection,
      query: question,
      limit: 5,
    });
    if (keyword.chunks.length) {
      finalChunks = keyword.chunks;
      finalMetadatas = keyword.metadatas;
      usedFilter = "keyword";
    } else {
      answer = "I could not find an answer in the textbook.";
    }
  } else {
    const context = finalChunks.join("\n\n");

    const prompt = `
You are a school tutor.
Answer ONLY using the textbook content below.
If the answer is not present, say "I don't know".

Textbook content:
${context}

Question:
${question}

Answer (simple, clear, student-friendly):
`;

    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const usage = result.usageMetadata || {};
    tokensUsed = usage.totalTokenCount || 0;
    answer =
      result.text ||
      result?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
      "";
  }

  // If model still says "I don't know", try keyword context (if not already)
  if (
    answer &&
    answer.trim().toLowerCase() === "i don't know" &&
    usedFilter !== "keyword"
  ) {
    const collection = await chroma.getCollection({ name: COLLECTION_NAME });
    const keyword = await keywordSearch({
      collection,
      query: question,
      limit: 5,
    });
    if (keyword.chunks.length) {
      finalChunks = keyword.chunks;
      finalMetadatas = keyword.metadatas;
      usedFilter = "keyword";

      const retryContext = finalChunks.join("\n\n");
      const retryPrompt = `
You are a school tutor.
Answer ONLY using the textbook content below.
If the answer is not present, say "I don't know".

Textbook content:
${retryContext}

Question:
${question}

Answer (simple, clear, student-friendly):
`;

      const retry = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: retryPrompt,
      });

      const usage = retry.usageMetadata || {};
      tokensUsed = usage.totalTokenCount || tokensUsed;
      answer =
        retry.text ||
        retry?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
        answer;
    }
  }

  // 🔹 Log AI usage
  const log = await AiChatLog.create({
    user_id: userId,
    user_query: question,
    ai_response: answer,
    tokens_used: tokensUsed,
    model_used: GEMINI_MODEL,
    ai_type: "rag",
    class_level: classLevel ?? null,
  });

  // 🔹 Deduct tokens (only if tokens used)
  if (tokensUsed > 0) {
    await deductTokens({
      userId,
      amount: tokensUsed,
      reason: "rag",
      refId: log.id,
    });
  }

  return {
    answer,
    sources: formatRagSources(finalMetadatas),
    source_type: finalChunks.length ? "rag" : "none",
    filters_used: usedFilter,
  };
}
