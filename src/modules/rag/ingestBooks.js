/**
 * node src/modules/rag/ingestBooks.js ./books
 */

import fs from "fs";
import path from "path";
import pdf from "pdf-parse";
import { ChromaClient } from "chromadb";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import dotenv from "dotenv";

dotenv.config();

// -------- CONFIG --------
const BOOKS_DIR = path.resolve(process.cwd(), process.argv[2]);
if (!BOOKS_DIR) {
  console.error("❌ Please provide books folder path");
  process.exit(1);
}

const CHROMA_PATH = "./rag_data/chroma";
const COLLECTION_NAME = "cbse_books";

// -------- GEMINI SETUP --------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});

// -------- CHROMA SETUP --------
const chroma = new ChromaClient({
  path: CHROMA_PATH,
});

// -------- HELPERS --------
async function getEmbedding(text) {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

function getAllPdfFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(getAllPdfFiles(filePath));
    } else if (file.endsWith(".pdf")) {
      results.push(filePath);
    }
  });

  return results;
}

// -------- MAIN INGEST FUNCTION --------
async function ingest() {
  console.log("📚 Starting ingestion...");
  console.log("Books folder:", BOOKS_DIR);

  const collection = await chroma.getOrCreateCollection({
    name: COLLECTION_NAME,
  });

  const pdfFiles = getAllPdfFiles(BOOKS_DIR);
  console.log(`Found ${pdfFiles.length} PDF files`);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  for (const filePath of pdfFiles) {
    console.log(`\n📄 Processing: ${filePath}`);

    // ---- Extract metadata from path ----
    // Example: books/class7/science.pdf
    const parts = filePath.split(path.sep);
    const className = parts.find((p) => p.startsWith("class")) || "unknown";
    const fileName = path.basename(filePath);

    // ---- Read PDF ----
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);

    if (!pdfData.text || pdfData.text.trim().length === 0) {
      console.warn("⚠️ Empty text, skipping:", filePath);
      continue;
    }

    // ---- Chunk text ----
    const chunks = await splitter.splitText(pdfData.text);
    console.log(`✂️ Created ${chunks.length} chunks`);

    // ---- Store chunks ----
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];

      const embedding = await getEmbedding(chunkText);

      await collection.add({
        ids: [`${fileName}-${i}`],
        embeddings: [embedding],
        documents: [chunkText],
        metadatas: [
          {
            syllabus: "CBSE",
            class: className.replace("class", ""),
            book: fileName,
          },
        ],
      });
    }

    console.log(`✅ Finished ${fileName}`);
  }

  console.log("\n🎉 Ingestion completed successfully!");
}

ingest().catch((err) => {
  console.error("❌ Ingestion failed:", err);
  process.exit(1);
});
