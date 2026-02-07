import { ChromaClient } from "chromadb";
import { GoogleGenerativeAI } from "@google/generative-ai";
import AiChatLog from "../ai-chat-logs/ai-chat-log.model.js";
import { deductTokens } from "../tokens/token.service.js";

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const COLLECTION_NAME = "cbse_books";

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

const chatModel = genAI.getGenerativeModel({
  model: GEMINI_MODEL,
});

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
  allowGlobal = false,
}) {
  const collection = await chroma.getCollection({
    name: COLLECTION_NAME,
  });

  const normalizedClass = normalizeClassLevel(classLevel);

  const filters = [];
  if (normalizedClass) {
    filters.push({
      label: "class",
      where: { class: String(normalizedClass) },
    });
  }
  if (allowGlobal) {
    filters.push({ label: "global", where: undefined });
  }

  for (const filter of filters) {
    const results = await collection.query({
      queryTexts: [query],
      nResults: 5,
      where: filter.where,
    });

    const chunks = results.documents.flat();
    if (chunks.length) {
      return {
        chunks,
        metadatas: results.metadatas.flat(),
        filter: filter.label,
        classLevel: normalizedClass,
      };
    }
  }

  return {
    chunks: [],
    metadatas: [],
    filter: null,
    classLevel: normalizedClass,
  };
}

export async function askRag({ question, classLevel, userId }) {
  const context = await retrieveRagContext({
    query: question,
    classLevel,
    allowGlobal: false,
  });

  const chunks = context.chunks;
  const sources = formatRagSources(context.metadatas);

  let answer;
  let tokensUsed = 0;

  if (!chunks.length) {
    answer = "I could not find an answer in the textbook.";
  } else {
    const context = chunks.join("\n\n");

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

    const result = await chatModel.generateContent(prompt);

    const usage = result.response.usageMetadata || {};
    tokensUsed = usage.totalTokenCount || 0;
    answer = result.response.text();
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
    sources,
    source_type: chunks.length ? "rag" : "none",
    filters_used: context.filter,
  };
}
