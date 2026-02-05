import asyncHandler from "../../shared/asyncHandler.js";
import { askRag } from "./rag.service.js";
import {
  chunkText,
  textToSpeech,
} from "../../shared/services/voice.service.js";

export const askQuestion = asyncHandler(async (req, res) => {
  const { question, classLevel } = req.body;
  const voiceEnabled = req.query.voice === "true";

  if (!question) {
    return res.status(400).json({ message: "Question is required" });
  }

  const result = await askRag({
    question,
    classLevel ,
    userId: req.user.id,
  });

  // 🔹 TEXT-ONLY (default)
  if (!voiceEnabled) {
    return res.json({
      question,
      answer: result.answer,
      sources: result.sources,
    });
  }

  // 🔹 VOICE MODE
  res.setHeader("Content-Type", "audio/wav");
  res.setHeader("Transfer-Encoding", "chunked");

  const sentences = chunkText(result.answer);

  for (const sentence of sentences) {
    try {
      const wavBuffer = await textToSpeech(sentence);
      res.write(wavBuffer);
    } catch (err) {
      console.error("TTS failed:", err.message);
      break; // stop voice, keep text correctness
    }
  }

  res.end();
});