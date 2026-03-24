import { ChromaClient } from "chromadb";
import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { deductTokens } from "../tokens/token.service.js";

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const COLLECTION_NAME = "cbse_books";
const execFileAsync = promisify(execFile);
const BOOKS_DIR = path.resolve(process.cwd(), "books");
const PDF_TEXT_CACHE_DIR = path.resolve(process.cwd(), "rag_data/pdf_text_cache");
const ROOT_BOOK_CACHE_KEY = "__root__";
const pdfPathCache = new Map();
const pdfTextCache = new Map();

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

const normalizeScopeValue = (value) => {
  if (value == null) return null;
  const text = decodeURIComponent(String(value).trim()).replace(/\\/g, "/");
  if (!text) return null;

  const normalizedBooksDir = BOOKS_DIR.replace(/\\/g, "/");
  if (text.startsWith(normalizedBooksDir)) {
    return path.relative(BOOKS_DIR, text).replace(/\\/g, "/");
  }

  return text
    .replace(/^.*?\/books\//i, "")
    .replace(/^\/+/, "")
    .replace(/^books\//i, "");
};

const resolveBookScope = (bookScope) => {
  if (!bookScope) return null;

  if (typeof bookScope === "string") {
    const normalized = normalizeScopeValue(bookScope);
    if (!normalized) return null;

    if (normalized.includes("/")) {
      return { type: "source_path", value: normalized };
    }

    if (/\.pdf$/i.test(normalized)) {
      return { type: "book", value: normalized };
    }

    return { type: "chapter", value: normalized.replace(/\.pdf$/i, "") };
  }

  if (typeof bookScope === "object") {
    const sourcePath = normalizeScopeValue(
      bookScope.sourcePath ||
        bookScope.source_path ||
        bookScope.bookPath ||
        bookScope.book_path ||
        bookScope.pdfPath ||
        bookScope.pdf_path ||
        bookScope.currentBook ||
        bookScope.current_book ||
        bookScope.selectedBook ||
        bookScope.selected_book
    );
    if (sourcePath) {
      return { type: "source_path", value: sourcePath };
    }

    const book = normalizeScopeValue(bookScope.book);
    if (book) {
      return { type: "book", value: book };
    }

    const chapter = normalizeScopeValue(bookScope.chapter);
    if (chapter) {
      return { type: "chapter", value: chapter.replace(/\.pdf$/i, "") };
    }
  }

  return null;
};

const buildScopeWhereClauses = (resolvedScope) => {
  if (!resolvedScope) return [null];

  if (resolvedScope.type === "source_path") {
    const bookName = path.basename(resolvedScope.value);
    const chapterName = path.basename(resolvedScope.value, path.extname(resolvedScope.value));
    return [
      { source_path: resolvedScope.value },
      { book: bookName },
      { chapter: chapterName },
    ];
  }

  if (resolvedScope.type === "book") {
    return [{ book: path.basename(resolvedScope.value) }];
  }

  if (resolvedScope.type === "chapter") {
    return [{ chapter: resolvedScope.value.replace(/\.pdf$/i, "") }];
  }

  return [null];
};

const normalizePathSegment = (value) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const INDIC_CHAR_CLASS =
  "\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F";
const INDIC_CHAR_REGEX = new RegExp(`[${INDIC_CHAR_CLASS}]`, "u");
const INDIC_JOIN_REGEX = new RegExp(`(?<=[${INDIC_CHAR_CLASS}])\\s+(?=[${INDIC_CHAR_CLASS}])`, "gu");

const collapseIndicLetterSpacing = (value) =>
  String(value || "")
    .normalize("NFC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(INDIC_JOIN_REGEX, "");

const containsIndicScript = (value) => INDIC_CHAR_REGEX.test(String(value || ""));

const normalizeSearchComparable = (value) =>
  collapseIndicLetterSpacing(value)
    .toLowerCase()
    .replace(/[“”‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const classLevelPatterns = (classLevel) => {
  const normalizedClass = normalizeClassLevel(classLevel);
  if (!normalizedClass) return [];

  return [
    new RegExp(`(^|/)class${normalizedClass}(/|$)`, "i"),
    new RegExp(`(^|/)${normalizedClass}(?:st|nd|rd|th)?\\s*std(/|$)`, "i"),
  ];
};

const extractQuotedPhrases = (question) =>
  [...String(question || "").matchAll(/["'‘’“”]([^"'‘’“”]{3,})["'‘’“”]/g)]
    .map((match) => String(match[1] || "").trim())
    .filter(Boolean);

const normalizeMathOcr = (value) =>
  String(value || "")
    .replace(/=\s*-\s*(\d+)\s+(\d+)\b/g, "= -$1/$2")
    .replace(/=\s*(\d+)\s+(\d+)\b/g, "= $1/$2")
    .replace(/\(\s*-\s*(\d+)\s+(\d+)\s*\)/g, "(-$1/$2)")
    .replace(/\(\s*(\d+)\s+(\d+)\s*\)/g, "($1/$2)")
    .replace(/\bsec\s*2\s*x\b/gi, "sec^2 x")
    .replace(/\bcos\s*x\s*x\b/gi, "cos x")
    .replace(/\bsin\s*x\s*x\b/gi, "sin x")
    .replace(/\btan\s*x\s*x\b/gi, "tan x")
    .replace(/\bcot\s*x\s*x\b/gi, "cot x")
    .replace(/\s+/g, " ")
    .trim();

const parseChunkOrder = (value) => {
  const match = String(value || "").match(/-(\d+)$/);
  return match ? Number(match[1]) : null;
};

const normalizeBookChunk = (value) =>
  String(value || "")
    .replace(/\0/g, "")
    .replace(/\s*([•●▪◦▸►])\s*/g, "\n- ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const escapeRegExp = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const mergeChunksWithOverlap = (parts) => {
  let merged = "";

  for (const part of parts.map((value) => normalizeBookChunk(value)).filter(Boolean)) {
    if (!merged) {
      merged = part;
      continue;
    }

    const maxOverlap = Math.min(120, merged.length, part.length);
    let overlap = 0;

    for (let size = maxOverlap; size >= 20; size -= 1) {
      if (merged.slice(-size) === part.slice(0, size)) {
        overlap = size;
        break;
      }
    }

    merged += overlap ? part.slice(overlap) : ` ${part}`;
  }

  return merged.trim();
};

const isNoiseSegment = (value) => {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return true;

  if (
    /^(exercise|example\s+\d+|fig\.?\s*\d+|reprint\b|let'?s explore\b|think about it\b|the big questions\b)/i.test(
      text
    )
  ) {
    return true;
  }

  if (/^\d+\s+[—―-]\s+/.test(text)) return true;
  if (/^(chapter|tapestry of the past|exploring society)/i.test(text)) return true;
  if (/^\d+\.\s+what\b/i.test(text)) return true;

  return false;
};

const isQuestionPrompt = (value) => {
  const text = String(value || "").trim();
  if (!text) return false;
  if (/^\d+\.\s+/.test(text)) return true;
  return /\?$/.test(text) && text.split(/\s+/).length <= 12;
};

const splitBookSegments = (value) =>
  normalizeBookChunk(value)
    .split(/\n+/)
    .flatMap((line) =>
      line
        .split(/(?<=[.?!;:])\s+(?=(?:[A-Z0-9"'“‘(]|- ))/)
        .map((segment) => normalizeMathOcr(segment))
        .map((segment) => segment.replace(/\s+/g, " ").trim())
        .filter(Boolean)
    );

const normalizeQuestionForRetrieval = (question) => {
  let normalized = normalizeSearchComparable(question).replace(/[^\p{L}\p{N}\s'-]/gu, " ");
  normalized = normalizeSearchComparable(normalized);

  if (!normalized) return "";

  const leadingWrappers = [
    /^please\s+/,
    /^(can you|could you|would you)\s+/,
    /^(tell me|teach me|help me understand)\s+/,
    /^explain\s+in\s+brief\s+about\s+/,
    /^explain\s+in\s+brief\s+/,
    /^explain\s+briefly\s+about\s+/,
    /^explain\s+briefly\s+/,
    /^briefly\s+explain\s+/,
    /^explain\s+in\s+detail\s+about\s+/,
    /^explain\s+in\s+detail\s+/,
    /^explain\s+about\s+/,
    /^explain\s+/,
    /^describe\s+/,
    /^define\s+/,
    /^discuss\s+/,
    /^write\s+(?:a\s+)?(?:brief\s+|short\s+|detailed\s+)?note\s+on\s+/,
    /^write\s+about\s+/,
    /^brief\s+note\s+on\s+/,
    /^short\s+note\s+on\s+/,
    /^detailed\s+note\s+on\s+/,
    /^what\s+is\s+/,
    /^what\s+are\s+/,
    /^who\s+is\s+/,
    /^who\s+are\s+/,
    /^what\s+do\s+you\s+mean\s+by\s+/,
    /^about\s+/,
  ];

  let changed = true;
  while (changed) {
    changed = false;
    for (const pattern of leadingWrappers) {
      const next = normalized.replace(pattern, "").trim();
      if (next !== normalized) {
        normalized = next;
        changed = true;
      }
    }
  }

  normalized = normalized
    .replace(/\bwith\s+examples\b/g, "")
    .replace(/\bwith\s+types\b/g, "")
    .replace(/\bexamples?\s+of\b/g, "")
    .replace(/\btypes?\s+of\b/g, "")
    .replace(/\bin\s+brief\b/g, "")
    .replace(/\bin\s+detail\b/g, "")
    .replace(/\bbriefly\b/g, "")
    .replace(/\bdetailed?\b/g, "")
    .replace(/\bbrief\b/g, "")
    .replace(/\babout\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.replace(/^(a|an|the)\s+/, "").trim();
};

const expandRetrievalTopic = (question) => {
  const normalized = normalizeQuestionForRetrieval(question);
  if (!normalized) return "";

  const aliasMap = new Map([
    ["buddhism", "buddha sangha siddhartha gautama ahimsa"],
    ["jainism", "mahavira vardhamana ahimsa anekantavada aparigraha"],
    ["vedic schools of thought", "upanishads vedanta yoga brahman atman"],
    ["vedic society", "janas rig veda sabha samiti clans"],
    ["the vedas and vedic culture", "vedas rig veda yajur veda sama veda atharva veda"],
    [
      "copernican revolution",
      "copernicus heliocentric model sun centered system planets rotate around the sun",
    ],
    [
      "european renaissance",
      "renaissance rebirth greek roman traditions burckhardt peter burke",
    ],
    [
      "was there a european renaissance in the fourteenth century",
      "renaissance rebirth greek roman traditions burckhardt peter burke fourteenth century",
    ],
  ]);

  const alias = aliasMap.get(normalized);
  return alias ? `${normalized} ${alias}` : normalized;
};

const buildRetrievalQueries = (question) => {
  const raw = String(question || "").trim();
  const normalized = normalizeQuestionForRetrieval(raw);
  const expanded = expandRetrievalTopic(raw);
  const expansionTail =
    expanded && normalized && expanded.startsWith(normalized)
      ? expanded.slice(normalized.length).trim()
      : "";
  const quoted = extractQuotedPhrases(raw);
  const keywords = [...new Set(tokenizeForMatch(normalized))];
  const compactKeywords = keywords.slice(0, 8).join(" ");

  return [
    expanded,
    expansionTail,
    normalized,
    raw,
    ...quoted,
    ...quoted.map((phrase) => normalizeQuestionForRetrieval(phrase)),
    compactKeywords,
  ]
    .map((value) => String(value || "").trim())
    .filter((value, index, values) => value.length >= 3 && values.indexOf(value) === index)
    .slice(0, 6);
};

const HISTORY_QUERY_HINTS = [
  "renaissance",
  "reformation",
  "nationalism",
  "revolution",
  "burke",
  "burckhardt",
  "greek",
  "roman",
  "medieval",
  "history",
];

const PHYSICS_QUERY_HINTS = [
  "copernic",
  "kepler",
  "galileo",
  "heliocentric",
  "planet",
  "gravitation",
  "orbit",
  "physics",
  "sun",
];

const hasAnyHint = (question, hints) => {
  const text = String(question || "").toLowerCase();
  return hints.some((hint) => text.includes(hint));
};

const buildCacheFilePath = (pdfPath) => {
  const relative = path.relative(BOOKS_DIR, pdfPath);
  const safe = relative.replace(/[^\w.-]/g, "_");
  return path.join(PDF_TEXT_CACHE_DIR, `${safe}.txt`);
};

const walkPdfFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkPdfFiles(fullPath)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) {
      files.push(fullPath);
    }
  }

  return files;
};

const getPdfPathsForClassLevel = async (classLevel) => {
  const normalizedClass = normalizeClassLevel(classLevel);
  const cacheKey = normalizedClass || ROOT_BOOK_CACHE_KEY;

  if (pdfPathCache.has(cacheKey)) {
    return pdfPathCache.get(cacheKey);
  }

  let files = [];
  try {
    if (!normalizedClass) {
      files = await walkPdfFiles(BOOKS_DIR);
    } else {
      const patterns = classLevelPatterns(normalizedClass);
      const allFiles = await walkPdfFiles(BOOKS_DIR);
      files = allFiles.filter((filePath) =>
        patterns.some((pattern) => pattern.test(filePath.replace(/\\/g, "/")))
      );
    }
  } catch {
    files = [];
  }

  pdfPathCache.set(cacheKey, files);
  return files;
};

const getRootLevelPdfPaths = async () => {
  if (pdfPathCache.has(ROOT_BOOK_CACHE_KEY)) {
    return pdfPathCache.get(ROOT_BOOK_CACHE_KEY);
  }

  let files = [];
  try {
    const entries = await fs.readdir(BOOKS_DIR, { withFileTypes: true });
    files = entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf"))
      .map((entry) => path.join(BOOKS_DIR, entry.name));
  } catch {
    files = [];
  }

  pdfPathCache.set(ROOT_BOOK_CACHE_KEY, files);
  return files;
};

const buildPdfCandidates = async ({ question, classLevel }) => {
  const candidates = new Set();
  const normalizedQuestion = String(question || "").toLowerCase();
  const isHistoryQuery = hasAnyHint(normalizedQuestion, HISTORY_QUERY_HINTS);
  const isPhysicsQuery = hasAnyHint(normalizedQuestion, PHYSICS_QUERY_HINTS);

  for (const pdfPath of await getPdfPathsForClassLevel(classLevel)) {
    candidates.add(pdfPath);
  }

  for (const pdfPath of await getRootLevelPdfPaths()) {
    candidates.add(pdfPath);
  }

  if (isHistoryQuery || isPhysicsQuery) {
    const allPdfPaths = await getPdfPathsForClassLevel(null);
    for (const pdfPath of allPdfPaths) {
      const normalizedPath = normalizePathSegment(path.relative(BOOKS_DIR, pdfPath));
      if (
        (isHistoryQuery &&
          /(history|sociology|political science|economics|geography|english)/i.test(normalizedPath)) ||
        (isPhysicsQuery && /(physics|science)/i.test(normalizedPath))
      ) {
        candidates.add(pdfPath);
      }
    }
  }

  const normalizedClass = normalizeClassLevel(classLevel);
  const queryKeywords = [...new Set(tokenizeForMatch(question))].filter((token) => token.length >= 4);

  return [...candidates]
    .map((pdfPath) => {
      const relativePath = path.relative(BOOKS_DIR, pdfPath);
      const normalizedPath = normalizePathSegment(relativePath);
      let score = 0;

      if (!relativePath.includes(path.sep)) {
        score += 6;
      }

      if (
        normalizedClass &&
        classLevelPatterns(normalizedClass).some((pattern) => pattern.test(pdfPath.replace(/\\/g, "/")))
      ) {
        score += 8;
      }

      if (isHistoryQuery && /(history|sociology|political science|economics|geography|english)/i.test(normalizedPath)) {
        score += 6;
      }

      if (isPhysicsQuery && /(physics|science)/i.test(normalizedPath)) {
        score += 6;
      }

      score += countKeywordMatches(normalizedPath, queryKeywords) * 3;

      return { pdfPath, score };
    })
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.pdfPath);
};

const getCachedPdfText = async (pdfPath) => {
  if (pdfTextCache.has(pdfPath)) {
    return pdfTextCache.get(pdfPath);
  }

  const cacheFilePath = buildCacheFilePath(pdfPath);
  let text = "";

  try {
    const [pdfStats, cacheStats] = await Promise.all([
      fs.stat(pdfPath),
      fs.stat(cacheFilePath).catch(() => null),
    ]);

    if (cacheStats && cacheStats.mtimeMs >= pdfStats.mtimeMs) {
      text = await fs.readFile(cacheFilePath, "utf8");
    } else {
      const { stdout } = await execFileAsync("pdftotext", [pdfPath, "-"]);
      text = String(stdout || "");
      if (text.trim()) {
        await fs.mkdir(PDF_TEXT_CACHE_DIR, { recursive: true });
        await fs.writeFile(cacheFilePath, text, "utf8");
      }
    }
  } catch {
    text = "";
  }

  pdfTextCache.set(pdfPath, text);
  return text;
};

const splitPdfParagraphs = (text) =>
  String(text || "")
    .split(/\n{2,}/)
    .map((part) => normalizeBookChunk(part))
    .filter((part) => part.length >= 40);

const findDirectPdfAnswer = async ({ question, classLevel }) => {
  const candidates = await buildPdfCandidates({ question, classLevel });
  if (!candidates.length) return null;

  let bestMatch = null;
  let bestScore = -Infinity;

  for (const pdfPath of candidates.slice(0, 80)) {
    const text = await getCachedPdfText(pdfPath);
    if (!text.trim()) continue;

    const paragraphs = splitPdfParagraphs(text);
    if (!paragraphs.length) continue;

    for (const paragraph of paragraphs) {
      const score = scoreChunkForQuestion({ chunk: paragraph, question });
      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          answer: paragraph,
          sourcePath: path.relative(BOOKS_DIR, pdfPath),
        };
      }
    }
  }

  if (!bestMatch || bestScore < 10) {
    return null;
  }

  const hasMatch = hasStrongKeywordMatch({
    question,
    chunks: [bestMatch.answer],
    metadatas: [{ source_path: bestMatch.sourcePath, book: path.basename(bestMatch.sourcePath) }],
  });

  if (!hasMatch) {
    return null;
  }

  return bestMatch;
};

const extractDefinitionSubject = (question) => normalizeQuestionForRetrieval(question);

const countKeywordMatches = (value, keywords) => {
  const haystack = normalizeSearchComparable(value);
  if (!haystack || !keywords.length) return 0;

  return keywords.filter((keyword) =>
    expandTokenVariants(normalizeSearchComparable(keyword)).some((variant) => haystack.includes(variant))
  ).length;
};

const getDefinitionCueScore = (value, subjectTokens) => {
  if (!subjectTokens.length) return 0;

  const haystack = String(value || "").toLowerCase();
  const subjectMatchCount = countKeywordMatches(haystack, subjectTokens);
  if (!subjectMatchCount) return 0;

  const cues = [
    "is defined as",
    "is called",
    "is known as",
    "refers to",
    "means",
    "term is used",
    "is used for",
    "what, then, is",
    "what then is",
  ];

  const hasCue = cues.some((cue) => haystack.includes(cue));
  return subjectMatchCount * 2 + (hasCue ? 4 : 0);
};

const buildSubjectPattern = (question) => {
  const subject = extractDefinitionSubject(question);
  if (!subject) return "";

  return subject
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const normalizedToken = collapseIndicLetterSpacing(token);
      if (!INDIC_CHAR_REGEX.test(normalizedToken)) {
        return escapeRegExp(normalizedToken);
      }

      return Array.from(normalizedToken)
        .map((char) => escapeRegExp(char))
        .join("\\s*");
    })
    .join("\\s+");
};

const getHeadingMatchScore = (value, question) => {
  const subjectPattern = buildSubjectPattern(question);
  if (!subjectPattern) return 0;

  const text = String(value || "");
  const headingPatterns = [
    new RegExp(`(^|\\n)[a-z]\\.?\\s+${subjectPattern}(\\n|$)`, "i"),
    new RegExp(`(^|\\n)${subjectPattern}(\\n|$)`, "i"),
  ];

  if (headingPatterns.some((pattern) => pattern.test(text))) {
    return 20;
  }

  const inlinePatterns = [
    new RegExp(`what\\s+is\\s+(?:a\\s+|an\\s+|the\\s+)?${subjectPattern}\\?`, "i"),
    new RegExp(`what,?\\s+then,?\\s+is\\s+(?:a\\s+|an\\s+|the\\s+)?${subjectPattern}\\?`, "i"),
    new RegExp(`\\b${subjectPattern}\\b`, "i"),
  ];

  if (inlinePatterns.some((pattern) => pattern.test(text))) {
    return 6;
  }

  return 0;
};

const scoreChunkForQuestion = ({ chunk, question }) => {
  const keywords = [...new Set(tokenizeForMatch(question))];
  const subjectTokens = tokenizeForMatch(extractDefinitionSubject(question));
  const text = normalizeBookChunk(chunk);

  let score = countKeywordMatches(text, keywords) * 4;
  score += getDefinitionCueScore(text, subjectTokens);
  score += getHeadingMatchScore(text, question);

  if (!isNoiseSegment(text)) score += 2;
  if (/\?$/.test(text) && text.split(/\s+/).length <= 12) score -= 2;
  if (/the big questions|let'?s explore|think about it/i.test(text)) score -= 5;

  return score;
};

const GENERIC_QUERY_TOKENS = new Set([
  "answer",
  "book",
  "books",
  "chapter",
  "class",
  "content",
  "century",
  "define",
  "describe",
  "detail",
  "europe",
  "european",
  "explain",
  "history",
  "lesson",
  "note",
  "question",
  "short",
  "student",
  "summary",
  "text",
  "textbook",
  "topic",
]);

const isDistinctiveKeyword = (token) =>
  String(token || "").length >= 6 && !GENERIC_QUERY_TOKENS.has(String(token || "").toLowerCase());

const buildMetadataSearchText = (metadata = {}) =>
  [metadata?.chapter, metadata?.book, metadata?.subject, metadata?.source_path]
    .filter(Boolean)
    .join(" ");

const scoreRecordForQuestion = ({ record, question }) => {
  const keywords = [...new Set(tokenizeForMatch(question))];
  const distinctiveKeywords = keywords.filter(isDistinctiveKeyword);
  const normalizedQuestion = normalizeQuestionForRetrieval(question);
  const quotedPhrases = extractQuotedPhrases(question).map((value) => value.toLowerCase());
  const chunkText = normalizeBookChunk(record?.chunk || "");
  const metadataText = buildMetadataSearchText(record?.metadata);
  const searchText = normalizeSearchComparable(`${chunkText}\n${metadataText}`);
  const distinctiveMatchCount = countKeywordMatches(searchText, distinctiveKeywords);

  let score = scoreChunkForQuestion({
    chunk: chunkText,
    question,
  });

  if (distinctiveKeywords.length && !distinctiveMatchCount) {
    score -= 18;
  }

  score += countKeywordMatches(metadataText, keywords) * 3;
  score += distinctiveMatchCount * 5;

  if (normalizedQuestion && searchText.includes(normalizeSearchComparable(normalizedQuestion))) {
    score += 16;
  }

  for (const phrase of quotedPhrases) {
    if (searchText.includes(normalizeSearchComparable(phrase))) {
      score += 12;
    }
  }

  if (Number.isFinite(record?.distance)) {
    score -= Number(record.distance) * 2;
  }

  return score;
};

const buildChunkRecords = ({ ids = [], chunks = [], metadatas = [], distances = [] }) =>
  chunks.map((chunk, index) => ({
    id: ids?.[index] || "",
    chunk: String(chunk || "").trim(),
    metadata: metadatas?.[index] || {},
    distance: distances?.[index] ?? null,
    chunkOrder:
      Number.isFinite(Number(metadatas?.[index]?.page_number)) &&
      Number.isFinite(Number(metadatas?.[index]?.chunk_index))
        ? Number(metadatas[index].page_number) * 1000 + Number(metadatas[index].chunk_index)
        : parseChunkOrder(ids?.[index]),
  }));

const dedupeChunkRecords = (records = []) => {
  const seen = new Map();

  for (const record of records) {
    const key = record.id || `${record.metadata?.source_path || "source"}-${record.chunkOrder ?? record.chunk}`;
    if (!seen.has(key)) {
      seen.set(key, record);
      continue;
    }

    const existing = seen.get(key);
    if (existing?.distance == null && record?.distance != null) {
      seen.set(key, record);
    }
  }

  return [...seen.values()];
};

const sortChunkRecords = (records = []) =>
  [...records].sort((left, right) => {
    const leftSource = left.metadata?.source_path || "";
    const rightSource = right.metadata?.source_path || "";
    if (leftSource !== rightSource) return leftSource.localeCompare(rightSource);

    if (left.chunkOrder == null && right.chunkOrder == null) return 0;
    if (left.chunkOrder == null) return 1;
    if (right.chunkOrder == null) return -1;
    return left.chunkOrder - right.chunkOrder;
  });

const pickBestChunkRecord = ({ ids = [], chunks = [], metadatas = [], distances = [], question }) =>
  buildChunkRecords({ ids, chunks, metadatas, distances })
    .filter((record) => record.chunk)
    .map((record) => ({
      ...record,
      score: scoreRecordForQuestion({ record, question }),
    }))
    .sort((left, right) => right.score - left.score)[0] || null;

const expandContextWithNeighborChunks = async ({
  ids = [],
  chunks = [],
  metadatas = [],
  distances = [],
  question,
}) => {
  const best = pickBestChunkRecord({
    ids,
    chunks,
    metadatas,
    distances,
    question,
  });

  if (!best?.metadata?.source_path) {
    return { ids, chunks, metadatas, distances };
  }

  try {
    const collection = await chroma.getCollection({ name: COLLECTION_NAME });
    const sourceRecords = await collection.get({
      where: { source_path: best.metadata.source_path },
      include: ["documents", "metadatas"],
    });

    let nearbyRecords = buildChunkRecords({
      ids: sourceRecords.ids || [],
      chunks: sourceRecords.documents || [],
      metadatas: sourceRecords.metadatas || [],
      distances: [],
    }).filter((record) => record.chunk);

    const bestPage = Number(best.metadata?.page_number);
    if (Number.isFinite(bestPage)) {
      nearbyRecords = nearbyRecords.filter((record) => {
        const page = Number(record.metadata?.page_number);
        return Number.isFinite(page) ? page >= bestPage - 1 && page <= bestPage + 2 : true;
      });
    } else if (best.chunkOrder != null) {
      nearbyRecords = nearbyRecords.filter((record) =>
        record.chunkOrder == null ? true : Math.abs(record.chunkOrder - best.chunkOrder) <= 12
      );
    }

    const merged = sortChunkRecords(
      dedupeChunkRecords([
        ...buildChunkRecords({ ids, chunks, metadatas, distances }),
        ...nearbyRecords,
      ])
    );

    return {
      ids: merged.map((record) => record.id),
      chunks: merged.map((record) => record.chunk),
      metadatas: merged.map((record) => record.metadata),
      distances: merged.map((record) => record.distance),
    };
  } catch {
    return { ids, chunks, metadatas, distances };
  }
};

const buildSourceScopedPassage = ({ chunks, ids, metadatas, question }) => {
  const records = buildChunkRecords({ ids, chunks, metadatas, distances: [] });

  const candidates = records.filter((record) => record.chunk);
  if (!candidates.length) return "";

  const ranked = candidates
    .map((record) => ({
      ...record,
      score: scoreRecordForQuestion({ record, question }),
    }))
    .sort((left, right) => right.score - left.score);

  const best = ranked[0];
  if (!best) return "";

  const sourcePath = best.metadata?.source_path || null;
  const sameSource = ranked.filter((record) => {
    if (!sourcePath) return true;
    return (record.metadata?.source_path || null) === sourcePath;
  });

  const orderedSourceChunks = sameSource
    .filter((record) =>
      best.chunkOrder == null || record.chunkOrder == null
        ? true
        : Math.abs(record.chunkOrder - best.chunkOrder) <= 4
    )
    .sort((left, right) => {
      if (left.chunkOrder == null && right.chunkOrder == null) return 0;
      if (left.chunkOrder == null) return 1;
      if (right.chunkOrder == null) return -1;
      return left.chunkOrder - right.chunkOrder;
    });

  return mergeChunksWithOverlap(orderedSourceChunks.map((record) => record.chunk));
};

const stripPageFurniture = (value) =>
  String(value || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^\d{1,4}$/.test(line))
    .filter((line) => !/^reprint\s+\d{4}-\d{2}$/i.test(line))
    .filter((line) => !/^exploring society:/i.test(line))
    .join("\n");

const trimPassageToSection = ({ passage, question }) => {
  let text = stripPageFurniture(normalizeBookChunk(passage));
  if (!text) return "";

  const subject = extractDefinitionSubject(question);
  const startPatterns = [];
  let matchedHeading = false;
  let matchedHeadingText = "";

  if (subject) {
    const subjectPattern = subject
      .split(/\s+/)
      .filter(Boolean)
      .map((token) => escapeRegExp(token))
      .join("\\s+");

    if (subjectPattern) {
      startPatterns.push({
        pattern: new RegExp(`(^|\\n)[a-z]\\.?\\s+${subjectPattern}(\\n|$)`, "i"),
        kind: "heading",
      });
      startPatterns.push({
        pattern: new RegExp(`(^|\\n)${subjectPattern}(\\n|$)`, "i"),
        kind: "heading",
      });
      startPatterns.push({
        pattern: new RegExp(`what\\s+is\\s+(?:a\\s+|an\\s+|the\\s+)?${subjectPattern}\\?`, "i"),
        kind: "inline",
      });
      startPatterns.push({
        pattern: new RegExp(`what,?\\s+then,?\\s+is\\s+(?:a\\s+|an\\s+|the\\s+)?${subjectPattern}\\?`, "i"),
        kind: "inline",
      });
      startPatterns.push({
        pattern: new RegExp(`\\b${subjectPattern}\\b`, "i"),
        kind: "inline",
      });
    }
  }

  for (const entry of startPatterns) {
    const match = text.match(entry.pattern);
    if (match?.index != null) {
      text = text.slice(match.index).trim();
      matchedHeading = entry.kind === "heading";
      matchedHeadingText = matchedHeading ? String(match[0] || "").trim() : "";
      break;
    }
  }

  if (matchedHeading) {
    const lines = text.split("\n");
    let startIndex = 0;

    if (matchedHeadingText) {
      const headingLineIndex = lines.findIndex((line) => {
        const candidate = line.trim();
        if (!candidate) return false;
        return candidate.toLowerCase() === matchedHeadingText.toLowerCase();
      });

      if (headingLineIndex >= 0) {
        for (let index = headingLineIndex + 1; index < lines.length; index += 1) {
          if (lines[index].trim()) {
            startIndex = index;
            break;
          }
        }
      }
    }

    const kept = [];

    for (let index = startIndex; index < lines.length; index += 1) {
      const line = lines[index].trim();
      if (!line) {
        kept.push(lines[index]);
        continue;
      }

      const isLetterHeading = index > 0 && /^[a-z]\.\s+[A-Z]/.test(line);
      const isTitleHeading =
        index > 0 &&
        /^[A-Z][A-Za-z'āīūṛṅñṣṭḍḥ-]+(?:\s+[A-Z][A-Za-z'āīūṛṅñṣṭḍḥ-]+){0,4}$/.test(line) &&
        !/:$/.test(line);

      if (isLetterHeading || isTitleHeading) {
        break;
      }

      kept.push(lines[index]);
    }

    text = kept.join("\n").trim();
  }

  const endPatterns = [
    /\bTHINK ABOUT IT\b/i,
    /\bLET'?S EXPLORE\b/i,
    /\bThe Big Questions\b/i,
  ];

  for (const pattern of endPatterns) {
    const match = text.match(pattern);
    if (match?.index != null && match.index > 0) {
      text = text.slice(0, match.index).trim();
      break;
    }
  }

  return text
    .replace(/(What Is [^?\n]+\?)(\s+)/i, "$1\n")
    .replace(/(What, then, is [^?\n]+\?)(\s+)/i, "$1\n")
    .replace(/\s+—\s+/g, " — ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const buildFocusedSegments = ({ chunks, ids, metadatas, question }) => {
  const passage = buildSourceScopedPassage({
    chunks,
    ids,
    metadatas,
    question,
  });
  const segments = splitBookSegments(passage);
  if (!segments.length) return [];

  const keywords = [...new Set(tokenizeForMatch(question))];
  const subjectTokens = tokenizeForMatch(extractDefinitionSubject(question));
  const scored = segments.map((segment, index) => {
    let score = countKeywordMatches(segment, keywords) * 3;
    score += getDefinitionCueScore(segment, subjectTokens);
    if (!isNoiseSegment(segment)) score += 1;
    if (isQuestionPrompt(segment)) score -= 1;

    return { index, segment, score };
  });

  const anchor = scored.sort((left, right) => right.score - left.score)[0];
  if (!anchor) return segments.slice(0, 4);

  const selected = [];
  const startIndex = isQuestionPrompt(anchor.segment)
    ? anchor.index
    : Math.max(0, anchor.index - 1);

  for (let index = startIndex; index < segments.length; index += 1) {
    const segment = segments[index];
    if (isNoiseSegment(segment)) {
      if (selected.length) break;
      continue;
    }

    if (isQuestionPrompt(segment) && selected.length >= 2) continue;

    selected.push(segment);

    if (selected.length >= 6 || selected.join(" ").length >= 900) {
      break;
    }
  }

  return selected;
};

const buildStrictBookAnswer = ({ chunks, ids, metadatas, question }) => {
  const exactPassage = trimPassageToSection({
    passage: buildSourceScopedPassage({
      chunks,
      ids,
      metadatas,
      question,
    }),
    question,
  });

  if (exactPassage) {
    return exactPassage;
  }

  const segments = buildFocusedSegments({
    chunks,
    ids,
    metadatas,
    question,
  }).filter((segment) => segment.length >= 8);

  if (!segments.length) return null;

  return segments
    .map((segment) => (segment.startsWith("- ") ? segment : segment.trim()))
    .join("\n");
};

const STOP_WORDS = new Set([
  "a",
  "about",
  "an",
  "and",
  "are",
  "can",
  "define",
  "describe",
  "did",
  "do",
  "does",
  "explain",
  "for",
  "from",
  "give",
  "how",
  "i",
  "in",
  "is",
  "me",
  "of",
  "on",
  "tell",
  "the",
  "this",
  "to",
  "was",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
]);

const tokenizeForMatch = (value) =>
  normalizeSearchComparable(value)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));

const isTopicStyleQuery = (value) => {
  const text = normalizeQuestionForRetrieval(value);
  if (!text) return false;
  if (/[?!]/.test(text)) return false;

  const keywords = tokenizeForMatch(text);
  return keywords.length >= 2 && keywords.length <= 6;
};

const expandTokenVariants = (token) => {
  const variants = new Set([token]);

  if (token.endsWith("es") && token.length > 4) {
    variants.add(token.slice(0, -2));
  }
  if (token.endsWith("s") && token.length > 3) {
    variants.add(token.slice(0, -1));
  }
  if (token.endsWith("ing") && token.length > 5) {
    variants.add(token.slice(0, -3));
  }
  if (token.endsWith("ed") && token.length > 4) {
    variants.add(token.slice(0, -2));
  }

  return [...variants].filter((value) => value.length >= 3);
};

const buildSearchText = (chunks, metadatas) => {
  const chunkText = Array.isArray(chunks) ? chunks.join(" ") : "";
  const metaText = Array.isArray(metadatas)
    ? metadatas
        .map((meta) =>
          [meta?.chapter, meta?.book, meta?.subject, meta?.source_path]
            .filter(Boolean)
            .join(" ")
        )
        .join(" ")
    : "";

  return normalizeSearchComparable(`${chunkText} ${metaText}`);
};

const hasStrongKeywordMatch = ({ question, chunks, metadatas }) => {
  const keywords = [...new Set(tokenizeForMatch(question))];
  if (!keywords.length) return true;

  if (containsIndicScript(question)) {
    return Array.isArray(chunks) && chunks.some((chunk) => String(chunk || "").trim().length >= 20);
  }

  const haystack = buildSearchText(chunks, metadatas);
  const matched = keywords.filter((keyword) =>
    expandTokenVariants(keyword).some((variant) => haystack.includes(variant))
  );
  const distinctiveKeywords = keywords.filter(isDistinctiveKeyword);
  const matchedDistinctive = distinctiveKeywords.filter((keyword) =>
    expandTokenVariants(keyword).some((variant) => haystack.includes(variant))
  );
  const requiredDistinctiveMatches =
    distinctiveKeywords.length >= 2 ? 2 : distinctiveKeywords.length;

  if (
    distinctiveKeywords.length &&
    matchedDistinctive.length < requiredDistinctiveMatches
  ) {
    return false;
  }

  if (isTopicStyleQuery(question)) {
    return (
      matched.length >= Math.min(2, keywords.length) &&
      (!distinctiveKeywords.length || matchedDistinctive.length >= 1)
    );
  }
  if (keywords.length === 1) return matched.length === 1;
  if (keywords.length === 2) return matched.length === 2;
  return matched.length >= Math.min(3, keywords.length);
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
  bookScope = null,
  allowGlobal = true,
}) {
  try {
    const normalizedClass = normalizeClassLevel(classLevel);
    const resolvedScope = resolveBookScope(bookScope);
    const collection = await chroma.getCollection({
      name: COLLECTION_NAME,
    });

    const queryVariants = buildRetrievalQueries(query);
    const recordMap = new Map();
    const scopeWhereClauses = resolvedScope
      ? buildScopeWhereClauses(resolvedScope)
      : normalizedClass
      ? [{ class: normalizedClass }]
      : [null];

    const mergeResults = async (where = null) => {
      for (const queryText of queryVariants) {
        const results = await collection.query({
          queryTexts: [queryText],
          nResults: 12,
          ...(where ? { where } : {}),
        });

        const records = buildChunkRecords({
          ids: (results.ids || []).flat(),
          chunks: (results.documents || []).flat(),
          metadatas: (results.metadatas || []).flat(),
          distances: (results.distances || []).flat(),
        }).filter((record) => record.chunk);

        for (const record of records) {
          const key =
            record.id ||
            `${record.metadata?.source_path || "source"}-${record.chunkOrder ?? record.chunk}`;
          const scoredRecord = {
            ...record,
            score: scoreRecordForQuestion({ record, question: query }),
          };

          if (!recordMap.has(key)) {
            recordMap.set(key, scoredRecord);
            continue;
          }

          const existing = recordMap.get(key);
          if (
            scoredRecord.score > existing.score ||
            (!Number.isFinite(existing.distance) && Number.isFinite(scoredRecord.distance))
          ) {
            recordMap.set(key, scoredRecord);
          }
        }
      }
    };

    if (resolvedScope) {
      for (const whereClause of scopeWhereClauses) {
        await mergeResults(whereClause);
        if (recordMap.size) break;
      }
    } else if (normalizedClass) {
      await mergeResults({ class: normalizedClass });
    } else {
      await mergeResults(null);
    }

    if (!resolvedScope && !recordMap.size && normalizedClass) {
      await mergeResults({ class: normalizedClass });
    }

    if (!resolvedScope && (!recordMap.size || (normalizedClass && allowGlobal))) {
      await mergeResults(null);
    }

    const ranked = [...recordMap.values()]
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        if (!Number.isFinite(left.distance) && !Number.isFinite(right.distance)) return 0;
        if (!Number.isFinite(left.distance)) return 1;
        if (!Number.isFinite(right.distance)) return -1;
        return left.distance - right.distance;
      })
      .slice(0, 16);

    const usedFilter = resolvedScope
      ? `${resolvedScope.type}_filtered`
      : normalizedClass
      ? allowGlobal
        ? "class_plus_global"
        : "class_filtered"
      : "global";

    return {
      ids: ranked.map((record) => record.id),
      chunks: ranked.map((record) => record.chunk),
      metadatas: ranked.map((record) => record.metadata),
      distances: ranked.map((record) => record.distance),
      filter: usedFilter,
      classLevel: normalizedClass,
      bookScope: resolvedScope,
      chromaAvailable: true,
    };
  } catch (err) {
    // Chroma unavailable
    return {
      ids: [],
      chunks: [],
      metadatas: [],
      distances: [],
      filter: "chroma_unavailable",
      classLevel: normalizeClassLevel(classLevel),
      bookScope: resolveBookScope(bookScope),
      chromaAvailable: false,
    };
  }
}

export async function askRag({ question, classLevel, bookScope = null, userId }) {
  const retrievalQuestion = normalizeQuestionForRetrieval(question) || String(question || "").trim();
  const expandedRetrievalQuestion = expandRetrievalTopic(question) || retrievalQuestion;
  const matchingQuestion = expandedRetrievalQuestion || retrievalQuestion || String(question || "").trim();
  const context = await retrieveRagContext({
    query: matchingQuestion,
    classLevel,
    bookScope,
    allowGlobal: !resolveBookScope(bookScope),
  });

  const chunks = context.chunks;

  let answer;
  let tokensUsed = 0;
  let usedFilter = context.filter;
  let finalIds = context.ids || [];
  let finalChunks = chunks;
  let finalMetadatas = context.metadatas;
  let finalDistances = context.distances || [];
  let billingWarning = null;

  if (finalChunks.length) {
    const expanded = await expandContextWithNeighborChunks({
      ids: finalIds,
      chunks: finalChunks,
      metadatas: finalMetadatas,
      distances: finalDistances,
      question: matchingQuestion,
    });

    finalIds = expanded.ids;
    finalChunks = expanded.chunks;
    finalMetadatas = expanded.metadatas;
    finalDistances = expanded.distances;
  }

  const hasKeywordMatch = hasStrongKeywordMatch({
    question: matchingQuestion,
    chunks: finalChunks,
    metadatas: finalMetadatas,
  });

  const bestDistance =
    finalDistances.length && finalDistances.every((value) => Number.isFinite(value))
      ? Math.min(...finalDistances)
      : null;
  const hasGoodVectorMatch = bestDistance != null && bestDistance <= 0.45;
  const hasRelevantContext = hasKeywordMatch || hasGoodVectorMatch;

  if (!chunks.length || !hasRelevantContext) {
    answer = "I don't know based on the provided books.";
    usedFilter = context.chromaAvailable ? "rag_no_match" : "chroma_unavailable";
    if (context.chromaAvailable && chunks.length && !hasRelevantContext) {
      finalIds = [];
      finalChunks = [];
      finalMetadatas = [];
      finalDistances = [];
    }
  }

  if (finalChunks.length && !answer) {
    const strict = buildStrictBookAnswer({
      chunks: finalChunks,
      ids: finalIds,
      metadatas: finalMetadatas,
      question: matchingQuestion,
    });

    answer = strict || "I don't know based on the provided books.";
    tokensUsed = 0;
  }

  if (userId) {
    // 🔹 Deduct tokens (only if tokens used)
    if (tokensUsed > 0) {
      try {
        await deductTokens({
          userId,
          amount: tokensUsed,
          reason: "rag",
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
