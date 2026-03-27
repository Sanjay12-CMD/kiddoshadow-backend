import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import AppError from "../../shared/appError.js";
import { PROMPTS } from "./teacher-ai.prompts.js";
import { retrieveRagContext, formatRagSources } from "../rag/rag.service.js";

const MAX_TEACHER_CONTEXT_CHARS = 6000;
const SENTENCE_MIN = 35;
const SENTENCE_MAX = 240;
const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.5-flash-lite").replace(/^models\//, "");
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
const BOOKS_DIR = path.resolve(process.cwd(), "books");
const RAG_DATA_DIR = path.resolve(process.cwd(), "rag_data");
const CHROMA_DATA_DIR = path.resolve(process.cwd(), "rag_data/chroma");

function isStemSubject(subject = "") {
  const normalized = String(subject).trim().toLowerCase();
  return ["math", "maths", "mathematics", "physics", "chemistry"].includes(normalized);
}

function trimTeacherContext(chunks = []) {
  const picked = [];
  let used = 0;

  for (const rawChunk of chunks) {
    const chunk = String(rawChunk || "").trim();
    if (!chunk) continue;

    const remaining = MAX_TEACHER_CONTEXT_CHARS - used;
    if (remaining <= 0) break;

    const next = chunk.slice(0, remaining);
    picked.push(next);
    used += next.length;
  }

  return picked;
}

function normalizeWhitespace(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s*([,.;:!?])/g, "$1")
    .trim();
}

function isQuotaError(err) {
  const status = Number(err?.status || err?.code || err?.error?.code || 0);
  const msg = String(err?.message || "").toLowerCase();
  return (
    status === 429 ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota exceeded") ||
    msg.includes("rate limit")
  );
}

function extractGeneratedText(result) {
  return (
    result?.text ||
    result?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("") ||
    ""
  );
}

function sanitizeGeneratedText(text = "") {
  return String(text || "")
    .replace(/^```(?:markdown|md|text)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/\r\n/g, "\n")
    .trim();
}

function splitIntoSentences(chunks = []) {
  const raw = chunks.join(" ");
  return raw
    .replace(/\r?\n+/g, " ")
    .split(/(?<=[.?!])\s+/)
    .map((line) => normalizeWhitespace(line))
    .filter((line) => line.length >= SENTENCE_MIN && line.length <= SENTENCE_MAX)
    .filter((line) => /[a-zA-Z]/.test(line))
    .filter((line) => !/^\d+[.)]?\s*$/.test(line))
    .filter((line) => !/^(figure|table|exercise|activity|example)\b/i.test(line));
}

function uniqueSentences(sentences = []) {
  const seen = new Set();
  const items = [];

  for (const sentence of sentences) {
    const key = sentence.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(sentence);
  }

  return items;
}

function extractTopicFromSentence(sentence = "") {
  const normalized = normalizeWhitespace(sentence).replace(/[.?!]+$/, "");
  const definitionalPatterns = [
    /^(.{3,60}?)\s+(?:is|are|was|were|means|refers to|is called|are called|can be defined as)\b/i,
    /^(.{3,60}?)\s+(?:includes|consists of|contains|describes|explains|focuses on)\b/i,
  ];

  for (const pattern of definitionalPatterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/^(the|a|an)\s+/i, "").trim();
    }
  }

  const words = normalized.split(" ");
  return words.slice(0, Math.min(6, words.length)).join(" ");
}

function createBlankedSentence(sentence = "") {
  const topic = extractTopicFromSentence(sentence);
  if (!topic || topic.length < 3) return sentence;
  const escaped = topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return sentence.replace(new RegExp(`\\b${escaped}\\b`, "i"), "_____ ");
}

function collectTextbookPoints(chunks = []) {
  return uniqueSentences(splitIntoSentences(chunks)).slice(0, 18);
}

function buildQuestionPaperFromTextbook({ payload, chunks }) {
  const classLevel = payload?.classLevel || "N/A";
  const subject = payload?.subject || "General";
  const chapter = payload?.chapter || payload?.topic || "Topic";
  const marks = Number(payload?.marks || payload?.totalMarks || 20);
  const points = collectTextbookPoints(chunks);

  if (!points.length) {
    return buildQuestionPaperFallback({ payload, chunks });
  }

  const objectiveBase = points.slice(0, 5);
  const shortBase = points.slice(5, 8).length ? points.slice(5, 8) : points.slice(0, 3);
  const longBase = points.slice(8, 10).length ? points.slice(8, 10) : points.slice(0, 2);
  const stemSubject = isStemSubject(subject);

  const objectiveQuestions = objectiveBase.map((sentence, index) => {
    const topic = extractTopicFromSentence(sentence);
    if (index % 2 === 0) {
      return `${index + 1}. According to the textbook, what is ${topic}? (1 mark)`;
    }
    return `${index + 1}. Fill in the blank from the textbook statement: ${createBlankedSentence(sentence)} (1 mark)`;
  });

  const shortQuestions = shortBase.map((sentence, index) => {
    const topic = extractTopicFromSentence(sentence);
    return `${index + 6}. Explain ${topic} in 2-3 lines using this textbook idea: "${sentence}" (2 marks)`;
  });

  const longQuestions = longBase.map((sentence, index) => {
    const qNo = index + 9;
    return `${qNo}. Write a detailed answer using the textbook point: "${sentence}" and related chapter evidence. (${index === 0 ? Math.max(marks - 11, 4) : 4} marks)`;
  });

  const stemQuestions = stemSubject
    ? [
        `11. From the textbook, write the important formula/equation related to ${extractTopicFromSentence(points[0] || chapter)} and explain each term. (2 marks)`,
        `12. Solve one textbook-style application based on ${extractTopicFromSentence(points[1] || chapter)} with proper steps and units. (3 marks)`,
      ]
    : [];

  const teacherPoints = points.slice(0, 6).map((line, index) => `${index + 1}. ${line}`).join("\n");

  return `**CBSE Textbook-Based Question Paper**\n
**Class:** ${classLevel}
**Subject:** ${subject}
**Chapter:** ${chapter}
**Total Marks:** ${marks}

**General Instructions:**
- All questions are compulsory.
- Answer only from the prescribed textbook content.
- Use textbook terms, examples, and chapter explanations wherever relevant.

**Section A: Objective Questions**
${objectiveQuestions.join("\n")}

**Section B: Short Answer**
${shortQuestions.join("\n")}

**Section C: Long Answer**
${longQuestions.concat(stemQuestions).join("\n")}

**Teacher Reference Points**
${teacherPoints}`;
}

function buildLessonSummaryFromTextbook({ payload, chunks }) {
  const classLevel = payload?.classLevel || "N/A";
  const subject = payload?.subject || "General";
  const topic = payload?.topic || payload?.chapter || "Topic";
  const points = collectTextbookPoints(chunks);

  if (!points.length) {
    return buildLessonSummaryFallback({ payload, chunks });
  }

  const opening = points.slice(0, 2).map((line) => `- ${line}`).join("\n");
  const conceptPoints = points.slice(2, 6).map((line) => `- ${line}`).join("\n");
  const recapPoints = points.slice(6, 8).map((line) => `- ${line}`).join("\n") || `- Revise the key ideas from the textbook section on ${topic}.`;
  const stemNotes = isStemSubject(subject)
    ? `
**STEM Classroom Notes**
- Highlight every formula, unit, or equation exactly as shown in the textbook.
- Ask students to practise any labelled diagram, graph, or structure mentioned in the chapter.
`
    : "";

  return `**Textbook-Based Lesson Summary**\n
**Class:** ${classLevel}
**Subject:** ${subject}
**Topic:** ${topic}

**Lesson Opening**
${opening}

**Core Concepts From Textbook**
${conceptPoints}
${stemNotes}
**Recap And Reinforcement**
${recapPoints}`;
}

function collectFallbackPoints(chunks = []) {
  return chunks
    .flatMap((chunk) =>
      String(chunk || "")
        .split(/(?<=[.?!])\s+/)
        .map((line) => line.trim())
        .filter((line) => line.length > 30)
    )
    .slice(0, 8);
}

function buildQuestionPaperFallback({ payload, chunks }) {
  const classLevel = payload?.classLevel || "N/A";
  const subject = payload?.subject || "General";
  const chapter = payload?.chapter || payload?.topic || "Topic";
  const marks = Number(payload?.marks || payload?.totalMarks || 20);
  const points = collectFallbackPoints(chunks);
  const sourceLines =
    points.length > 0
      ? points.map((line, index) => `${index + 1}. ${line}`).join("\n")
      : "1. Textbook context was too thin for direct extraction.\n2. Add more chapter text to RAG for richer paper generation.";

  return `**CBSE Textbook-Based Question Paper**\n
**Class:** ${classLevel}
**Subject:** ${subject}
**Chapter:** ${chapter}
**Total Marks:** ${marks}

**Textbook Extraction Status:**
- Direct chapter question extraction was limited.
- Review the textbook context below and regenerate if needed.

**Teacher Reference Points**
${sourceLines}`;
}

function buildLessonSummaryFallback({ payload, chunks }) {
  const classLevel = payload?.classLevel || "N/A";
  const subject = payload?.subject || "General";
  const topic = payload?.topic || payload?.chapter || "Topic";
  const points = collectFallbackPoints(chunks);
  const bulletLines =
    points.length > 0
      ? points.map((line) => `- ${line}`).join("\n")
      : `- Textbook context for ${topic} was too limited for a structured summary.`;

  return `**Textbook-Based Lesson Summary**\n
**Class:** ${classLevel}
**Subject:** ${subject}
**Topic:** ${topic}

**Available Textbook Points**
${bulletLines}`;
}

function detectTeacherAiFallbackReason(context) {
  const filter = context?.filter || null;
  const booksExists = fs.existsSync(BOOKS_DIR);
  const ragDataExists = fs.existsSync(RAG_DATA_DIR);
  const chromaDataExists = fs.existsSync(CHROMA_DATA_DIR);

  if (!booksExists) {
    return {
      code: "books_missing",
      lines: [
        `- Missing books folder: ${BOOKS_DIR}`,
        "- Add textbook PDFs under the books directory before running ingestion.",
      ],
    };
  }

  if (!ragDataExists || !chromaDataExists) {
    return {
      code: "rag_index_missing",
      lines: [
        `- Missing RAG index: ${CHROMA_DATA_DIR}`,
        "- Run textbook ingestion to create the Chroma collection.",
      ],
    };
  }

  if (filter === "chroma_unavailable" || filter === "rag_error") {
    return {
      code: "chroma_unavailable",
      lines: [
        "- Chroma database is not reachable from the backend.",
        "- Start Chroma with the configured CHROMA_URL before generating AI content.",
      ],
    };
  }

  return {
    code: "no_matching_chunks",
    lines: [
      "- No matching chapter chunks were retrieved for this topic.",
      "- Re-ingest the correct textbook PDF and verify the chapter title matches the topic you typed.",
    ],
  };
}

function appendFallbackReason(text, context) {
  const reason = detectTeacherAiFallbackReason(context);
  return `${text}\n\n**RAG Status**\n${reason.lines.join("\n")}`;
}

function buildTeacherAiFromTextbook({ aiType, payload, chunks }) {
  if (aiType === "question_paper") {
    return buildQuestionPaperFromTextbook({ payload, chunks });
  }
  if (aiType === "lesson_summary") {
    return buildLessonSummaryFromTextbook({ payload, chunks });
  }
  return "Unable to generate textbook-based content for this task.";
}

function formatContextBlock({ chunks = [], metadatas = [] }) {
  return chunks
    .map((chunk, index) => {
      const metadata = metadatas[index] || {};
      const sourcePath = metadata.source_path || metadata.book || metadata.chapter || "unknown";
      const pageNumber = metadata.page_number ? ` page ${metadata.page_number}` : "";
      return `[Source: ${sourcePath}${pageNumber}]\n${String(chunk || "").trim()}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

function buildTeacherAiGeminiPrompt({ aiType, payload, promptText, chunks, metadatas }) {
  const classLevel = payload?.classLevel || "N/A";
  const subject = payload?.subject || "General";
  const topic = payload?.topic || payload?.chapter || "Topic";
  const marks = Number(payload?.marks || payload?.totalMarks || 20);
  const contextText = formatContextBlock({ chunks, metadatas }) || "No textbook context retrieved.";

  if (aiType === "question_paper") {
    return `
You are generating a CBSE-style question paper for a teacher.

Teacher request:
${promptText}

Use ONLY the textbook context below as the academic source of truth.
Do not turn the answer into a lesson summary.
Create a real question paper with exam questions, not reference notes.

Class: ${classLevel}
Subject: ${subject}
Chapter/Topic: ${topic}
Total Marks: ${marks}

Output rules:
- Return plain text only.
- Start with the title "CBSE Textbook-Based Question Paper".
- Include Class, Subject, Chapter, and Total Marks lines.
- Add "General Instructions".
- Add three sections exactly named:
Section A: Objective Questions
Section B: Short Answer
Section C: Long Answer
- Every question line must begin with a number like "1. ".
- Include marks on every question line.
- Keep the paper classroom-ready and distinct from a summary.
- Do not include source citations, explanations to the teacher, or markdown code fences.

Textbook context:
${contextText}
`;
  }

  return `
You are generating a teacher-facing lesson summary from textbook material.

Teacher request:
${promptText}

Use ONLY the textbook context below as the academic source of truth.
Do not turn the answer into a question paper.

Class: ${classLevel}
Subject: ${subject}
Topic: ${topic}

Output rules:
- Return plain text only.
- Start with the title "Textbook-Based Lesson Summary".
- Include Class, Subject, and Topic lines.
- Add short sections named:
Lesson Opening
Core Concepts From Textbook
Teaching Flow
Recap And Reinforcement
- Use bullet points under the sections.
- Do not number lines like exam questions.
- Make it easy for a teacher to explain in one class period.
- Do not include source citations, teacher notes outside the summary, or markdown code fences.

Textbook context:
${contextText}
`;
}

async function generateTeacherAiWithGemini({ aiType, payload, promptText, chunks, metadatas }) {
  if (!ai || !chunks.length) return null;

  try {
    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildTeacherAiGeminiPrompt({
        aiType,
        payload,
        promptText,
        chunks,
        metadatas,
      }),
    });

    const text = sanitizeGeneratedText(extractGeneratedText(result));
    return text || null;
  } catch (err) {
    if (isQuotaError(err)) return null;
    return null;
  }
}

export async function runTeacherAI({ user, aiType, payload }) {
  if (user.role !== "teacher") {
    throw new AppError("Only teachers can use this AI feature", 403);
  }

  const promptBuilder = PROMPTS[aiType];
  if (!promptBuilder) {
    throw new AppError("Invalid teacher AI task", 400);
  }

  const safePayload = { subject: "General", ...payload };
  const promptText = promptBuilder(safePayload);

  const ragQuery = safePayload?.topic || safePayload?.chapter;
  const hasScope = safePayload?.classLevel;
  const requireRag = new Set(["lesson_summary", "question_paper"]);

  if (!ragQuery || !hasScope) {
    if (requireRag.has(aiType)) {
      return {
        text: buildTeacherAiFromTextbook({ aiType, payload: safePayload, chunks: [] }),
        source_type: "fallback",
        sources: [],
        filters_used: null,
      };
    }
  }

  let context;
  try {
    context = await retrieveRagContext({
      query: ragQuery,
      classLevel: safePayload.classLevel,
      allowGlobal: true,
    });
  } catch {
    context = {
      chunks: [],
      metadatas: [],
      distances: [],
      filter: "rag_error",
    };
  }

  const trimmedChunks = trimTeacherContext(context.chunks || []);
  const text =
    (await generateTeacherAiWithGemini({
      aiType,
      payload: safePayload,
      promptText,
      chunks: trimmedChunks,
      metadatas: context.metadatas || [],
    })) ||
    buildTeacherAiFromTextbook({
      aiType,
      payload: safePayload,
      chunks: trimmedChunks,
    });

  const finalText = trimmedChunks.length ? text : appendFallbackReason(text, context);

  return {
    text: finalText,
    source_type: trimmedChunks.length ? "rag" : "fallback",
    sources: formatRagSources(context.metadatas || []),
    filters_used: context.filter || null,
  };
}
