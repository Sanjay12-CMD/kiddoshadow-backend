import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.5-flash-lite").replace(
  /^models\//,
  ""
);

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export const STEM_NO_ANSWER_TEXT = "It is not provided in the book.";

const EQUATION_QUESTION_PATTERNS = [
  /\bcalculate\b/i,
  /\bevaluate\b/i,
  /\bsolve\b/i,
  /\bsimplify\b/i,
  /\bderive\b/i,
  /\bderivative\b/i,
  /\bprove\b/i,
  /\bfind\s+the\s+value\b/i,
  /\bfind\s+the\s+principal\s+value\b/i,
  /\bprincipal\s+value\b/i,
  /\bvalue\s+of\b/i,
  /\bformula\b/i,
  /\bequation\b/i,
  /\bnumerical\b/i,
  /\bintegrate\b/i,
  /\bdifferentiate\b/i,
  /\broot\b/i,
  /\broots\b/i,
  /\bmean\b/i,
  /\baverage\b/i,
  /\bmedian\b/i,
  /\bmode\b/i,
  /\bprobability\b/i,
  /\bratio\b/i,
  /\bpercentage\b/i,
  /\barea\b/i,
  /\bperimeter\b/i,
  /\bvolume\b/i,
  /\binterest\b/i,
  /\bstandard\s+deviation\b/i,
  /\bvariance\b/i,
  /\bsin\s*\^?\s*-?1\b/i,
  /\bcos\s*\^?\s*-?1\b/i,
  /\btan\s*\^?\s*-?1\b/i,
  /\blog\b/i,
  /\bln\b/i,
  /\bdy\/dx\b/i,
  /\bdx\/dt\b/i,
  /\bf\s*\(\s*x\s*\)/i,
  /√/,
  /[=+\-*/^]/,
  /\d+\s*(?:cm|mm|m|km|kg|g|mg|s|ms|m\/s|m\/s\^2|n|j|w|v|a|ohm|pa|mol|%|rs|₹)/i,
];

export const isEquationBasedQuestion = (question) => {
  const text = String(question || "").trim();
  if (!text) return false;

  return EQUATION_QUESTION_PATTERNS.some((pattern) => pattern.test(text));
};

const formatContextBlock = ({ chunks = [], metadatas = [] }) =>
  chunks
    .map((chunk, index) => {
      const metadata = metadatas[index] || {};
      const sourcePath = metadata.source_path || metadata.book || "unknown";
      const pageNumber = metadata.page_number ? ` page ${metadata.page_number}` : "";
      return `[Source: ${sourcePath}${pageNumber}]\n${String(chunk || "").trim()}`;
    })
    .filter(Boolean)
    .join("\n\n");

const hasStrictStemFormat = (value) => {
  const text = String(value || "").trim();
  if (!text) return false;

  return (
    /^Formula:\s*.+/im.test(text) &&
    /^Given:\s*.+/im.test(text) &&
    /^Substitution:\s*.+/im.test(text) &&
    /^Calculation:\s*.+/im.test(text) &&
    /^Final Answer:\s*.+/im.test(text)
  );
};

const buildStemSolverPrompt = ({ question, contextText }) => `You are a backend textbook solver for an educational RAG system.

You are handling an equation-based student question.

STRICT RULES:
1. If the textbook context contains the relevant formula or method, prefer that context.
2. If the textbook context is missing or incomplete, but the student's question itself contains enough mathematical information to solve the problem, solve it directly from the question.
3. Do not answer non-equation or non-mathematical questions.
4. Do not invent hidden values that are not present in the textbook context or in the student's question.
5. If the problem cannot be solved from the retrieved textbook context and also cannot be solved from the information explicitly present in the student's question, reply exactly:
${STEM_NO_ANSWER_TEXT}
6. For solvable problems, you must output exactly these five sections and nothing else:
Formula: <Formula taken from textbook context>
Given: <Values from the question>
Substitution: <Insert values into formula>
Calculation: <Step-by-step calculation>
Final Answer: <Result with unit>
7. If no formula is explicitly present in the textbook context, use the formula or algebraic method implied by the student's question and clearly state that formula.
8. Preserve textbook notation exactly whenever possible.
9. If the unit is not provided in the question or context, write "unit not specified" in the Final Answer line.
10. Do not include markdown bullets, code fences, or extra commentary.

Textbook Context:
${contextText}

Student Question:
${question}
`;

export async function solveWithGeminiFromTextbook({ question, chunks = [], metadatas = [] }) {
  if (!isEquationBasedQuestion(question)) {
    return STEM_NO_ANSWER_TEXT;
  }

  if (!ai) {
    return STEM_NO_ANSWER_TEXT;
  }

  const contextText = formatContextBlock({ chunks, metadatas }).trim() || "No relevant textbook context retrieved.";

  const prompt = buildStemSolverPrompt({ question, contextText });

  try {
    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const answer =
      result?.text ||
      result?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("") ||
      "";

    const cleaned = String(answer || "").trim();
    if (!cleaned) {
      return STEM_NO_ANSWER_TEXT;
    }

    if (cleaned === STEM_NO_ANSWER_TEXT) {
      return cleaned;
    }

    if (!hasStrictStemFormat(cleaned)) {
      return STEM_NO_ANSWER_TEXT;
    }

    return cleaned;
  } catch {
    return STEM_NO_ANSWER_TEXT;
  }
}
