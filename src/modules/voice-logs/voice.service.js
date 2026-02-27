import VoiceLog from "./voice-log.model.js";
import { askRag } from "../rag/rag.service.js";
import { textToSpeech } from "../../shared/services/voice.service.js";

/* ============================================
   🔊 MAIN VOICE CHAT SERVICE
============================================ */
export const processVoiceChat = async ({
  question,
  purpose = "general",
  userId,
  classLevel = null,
}) => {
  if (!question) {
    throw new Error("Question is required");
  }

  // 1️⃣ Call existing RAG service (NO CHANGES TO RAG FILE)
  const ragResult = await askRag({
    question,
    classLevel,
    userId,
  });

  const answerText = ragResult.answer;

  if (!answerText) {
    throw new Error("Failed to generate answer");
  }

  // 2️⃣ Send Answer Text to NeMo TTS
  const audioBuffer = await textToSpeech(answerText);

  // 3️⃣ Save Voice Log
  if (userId) {
    await VoiceLog.create({
      user_id: userId,
      purpose,
      text: answerText,
      tokens_used: ragResult.tokens_used || 0,
    });
  }

  // 4️⃣ Return Audio Buffer
  return {
    answer: answerText,
    audioBuffer,
  };
};

/* ============================================
   📜 GET USER VOICE LOGS
============================================ */
export const getUserVoiceLogs = async (userId) => {
  return await VoiceLog.findAll({
    where: { user_id: userId },
    order: [["created_at", "DESC"]],
  });
};
