import { GoogleGenAI } from "@google/genai";
import AppError from "../../shared/appError.js";
import { deductTokens } from "../tokens/token.service.js";
import { PROMPTS } from "./teacher-ai.prompts.js";
import { retrieveRagContext, formatRagSources } from "../rag/rag.service.js";

const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.5-flash-lite").replace(/^models\//, "");
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;
const MAX_TEACHER_CONTEXT_CHARS = 6000;

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
  const stemSubject = isStemSubject(subject);
  const sourceLines =
    points.length > 0
      ? points.map((line, index) => `${index + 1}. ${line}`).join("\n")
      : "1. Refer to the prescribed textbook content for this chapter.\n2. Frame answers using textbook definitions and examples.\n3. Keep responses concise and concept-based.";
  const stemInstructions = stemSubject
    ? `
- Include formula-based, equation-based, and application-based questions where relevant.
- Preserve units, symbols, subscripts, superscripts, and scientific notation.
- Ask students to draw neat labelled diagrams wherever the chapter involves figures, apparatus, graphs, circuits, structures, or geometrical constructions.
`
    : "";
  const stemQuestions = stemSubject
    ? `
10. State the important formula(s) used in this chapter and explain one term in each formula. (2 marks)
11. Solve one problem using the appropriate equation or formula with correct units/steps. (3 marks)
12. Draw and label one relevant diagram/graph/structure from the chapter and explain it briefly. (3 marks)
`
    : "";

  return `**CBSE Sample Question Paper**\n
**Class:** ${classLevel}
**Subject:** ${subject}
**Chapter:** ${chapter}
**Total Marks:** ${marks}

**General Instructions:**
- All questions are compulsory.
- Answer using textbook concepts from the chapter.
- Write neat and precise answers.
${stemInstructions}

**Section A: MCQs**
1. Write one objective question from the chapter introduction. (1 mark)
2. Write one objective question from the main concept. (1 mark)
3. Write one objective question from an example in the lesson. (1 mark)
4. Write one objective question from a key term or definition. (1 mark)
5. Write one objective question from the summary portion. (1 mark)

**Section B: Short Answer**
6. Explain one key concept from the chapter in 2-3 lines. (2 marks)
7. Differentiate between any two important ideas from the chapter. (2 marks)
8. Answer a textbook-based application question. (2 marks)

**Section C: Long Answer**
9. Write a detailed answer using textbook evidence and examples from the chapter. (${Math.max(marks - 11, 4)} marks)
${stemQuestions}

**Teacher Reference Points**
${sourceLines}`;
}

function buildLessonSummaryFallback({ payload, chunks }) {
  const classLevel = payload?.classLevel || "N/A";
  const subject = payload?.subject || "General";
  const topic = payload?.topic || payload?.chapter || "Topic";
  const points = collectFallbackPoints(chunks);
  const stemSubject = isStemSubject(subject);
  const bulletLines =
    points.length > 0
      ? points.map((line) => `- ${line}`).join("\n")
      : "- Introduce the topic with textbook definitions.\n- Explain the main concept in simple classroom language.\n- Reinforce with one example and one recap question.";
  const stemNotes = stemSubject
    ? `
**STEM Teaching Focus**
- Highlight the main equations and formulas from the lesson.
- Explain the meaning of each variable and include units where required.
- Add one worked example using the formula or equation.
- Mention any diagram, graph, apparatus, structure, circuit, or construction students must practise drawing.
`
    : "";

  return `**Lesson Summary**\n
**Class:** ${classLevel}
**Subject:** ${subject}
**Topic:** ${topic}

**Classroom Flow**
- Start with a short introduction to the topic.
- Explain the main ideas step by step.
- Reinforce understanding with examples from the textbook.
- End with recap questions and a short revision activity.
${stemNotes}

**Key Teaching Points**
${bulletLines}`;
}

function buildTeacherAiFallback({ aiType, payload, chunks }) {
  if (aiType === "question_paper") {
    return buildQuestionPaperFallback({ payload, chunks });
  }
  if (aiType === "lesson_summary") {
    return buildLessonSummaryFallback({ payload, chunks });
  }
  return "Unable to generate AI content at the moment.";
}

function mapTeacherAiProviderError(error) {
  const message = String(error?.message || "");
  const lowerMessage = message.toLowerCase();
  const statusCode = Number(error?.status || error?.statusCode || error?.code);

  if (
    statusCode === 429 ||
    lowerMessage.includes("quota") ||
    lowerMessage.includes("resource_exhausted") ||
    lowerMessage.includes("rate limit") ||
    lowerMessage.includes("too many requests")
  ) {
    return new AppError(
      "AI service quota exceeded. Please retry later or use a different API key.",
      429
    );
  }

  if (
    statusCode === 503 ||
    lowerMessage.includes("service unavailable") ||
    lowerMessage.includes("overloaded")
  ) {
    return new AppError("AI service is temporarily unavailable. Please retry shortly.", 503);
  }

  return new AppError("Teacher AI generation failed.", 502);
}

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
  let modelUsed = GEMINI_MODEL;
  const requireRag = new Set(["lesson_summary", "question_paper"]);
  let trimmedChunks = [];

  const ragQuery = payload?.topic || payload?.chapter;
  const hasScope = payload?.classLevel;

  if (ragQuery && hasScope) {
    let context;
    try {
      context = await retrieveRagContext({
        query: ragQuery,
        classLevel: payload.classLevel,
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

    filtersUsed = context.filter;

    if (context.chunks.length) {
      trimmedChunks = trimTeacherContext(context.chunks);
      const ragText = trimmedChunks.join("\n\n");
      prompt = `
${prompt}

Use ONLY the textbook context below. If it is insufficient, say "I don't know."

Textbook context:
${ragText}
`;

      sourceType = "rag";
      sources = formatRagSources(context.metadatas);
    } else if (requireRag.has(aiType)) {
      const fallback = buildTeacherAiFallback({
        aiType,
        payload,
        chunks: [],
      });
      return {
        text: fallback,
        source_type: "fallback",
        sources: [],
        filters_used: filtersUsed,
      };
    }
  } else if (requireRag.has(aiType)) {
    const fallback = buildTeacherAiFallback({
      aiType,
      payload,
      chunks: [],
    });
    return {
      text: fallback,
      source_type: "fallback",
      sources: [],
      filters_used: null,
    };
  }

  // 🤖 Call Gemini
  let result;
  let output = "";
  let tokensUsed = 0;
  if (ai) {
    try {
      result = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });
      const usage = result.usageMetadata || {};
      tokensUsed = usage.totalTokenCount || 0;
      output =
        result.text ||
        result?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
        "";
    } catch {
      output = buildTeacherAiFallback({
        aiType,
        payload,
        chunks: trimmedChunks,
      });
      tokensUsed = 0;
      sourceType = trimmedChunks.length ? "rag_fallback" : "fallback";
      modelUsed = "teacher_ai_fallback";
    }
  } else {
    output = buildTeacherAiFallback({
      aiType,
      payload,
      chunks: trimmedChunks,
    });
    tokensUsed = 0;
    sourceType = trimmedChunks.length ? "rag_fallback" : "fallback";
    modelUsed = "teacher_ai_fallback";
  }

  // 💰 Deduct tokens
  if (tokensUsed > 0) {
    try {
      await deductTokens({
        userId: user.id,
        amount: tokensUsed,
        reason: aiType,
      });
    } catch {}
  }

  return {
    text: output,
    source_type: sourceType,
    sources,
    filters_used: filtersUsed,
  };
}
