import { ChromaClient } from "chromadb";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

export async function askRag({ question, classLevel }) {
  const collection = await chroma.getCollection({
    name: COLLECTION_NAME,
  });

  // 1️⃣ Embed question
  const queryEmbedding = await embed(question);

  // 2️⃣ Search Chroma
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: 5,
    where: classLevel ? { class: String(classLevel) } : undefined,
  });

  const chunks = results.documents.flat();

  if (!chunks.length) {
    return "I could not find an answer in the textbook.";
  }

  // 3️⃣ Build grounded prompt
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

  // 4️⃣ Ask Gemini
  const result = await chatModel.generateContent(prompt);
  return result.response.text();
}
