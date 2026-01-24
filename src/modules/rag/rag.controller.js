import asyncHandler from "../../shared/asyncHandler.js";
import { askRag } from "./rag.service.js";

export const askQuestion = asyncHandler(async (req, res) => {
  const { question, classLevel } = req.body;

  if (!question) {
    return res.status(400).json({ message: "Question is required" });
  }

  const result = await askRag({
    question,
    classLevel,
    userId: req.user.id,
  });

  res.json({
    question,
    answer: result.answer,
    sources: result.sources,
  });
});
