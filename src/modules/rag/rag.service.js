import { ChromaClient } from "chromadb";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import AiChatLog from "../ai-chat-logs/ai-chat-log.model.js";
import { deductTokens } from "../tokens/token.service.js";

const PROJECT_ROOT = process.cwd();
const CHROMA_PATH = path.join(PROJECT_ROOT, "rag_data", "chroma");
const COLLECTION_NAME = "cbse_books";

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});

const chatModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

// Chroma setup
const chroma = new ChromaClient({ path: CHROMA_PATH });

async function embed(text) {
  const res = await embeddingModel.embedContent(text);
  return res.embedding.values;
}

export async function askRag({ question, classLevel, userId }) {
  const collection = await chroma.getCollection({
    name: COLLECTION_NAME,
  });

  const queryEmbedding = await embed(question);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: 5,
    where: classLevel ? { class: String(classLevel) } : undefined,
  });

  const chunks = results.documents.flat();
  const metadatas = results.metadatas.flat();

  const sources = [
    ...new Set(metadatas.map(m => `Class ${m.class} - ${m.book}`)),
  ];

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
    model_used: "gemini-1.5-flash",
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
  };
}
  