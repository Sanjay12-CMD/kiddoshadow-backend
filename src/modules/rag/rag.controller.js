import asyncHandler from "../../shared/asyncHandler.js";
import { askRag } from "./rag.service.js";

export const askQuestion = asyncHandler(async (req, res) => {
  const { question, classLevel } = req.body;

  if (!question) {
    return res.status(400).json({ message: "Question is required" });
  }

  const answer = await askRag({ question, classLevel });

  res.json({
    question,
    answer,
  });
});
