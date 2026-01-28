import asyncHandler from "../../shared/asyncHandler.js";
import Quiz from "./quiz.model.js";
import QuizQuestion from "./quiz-question.model.js";

export const createQuiz = asyncHandler(async (req, res) => {
  const {
    title,
    topicId,
    difficulty,
    questions,
  } = req.body;

  if (!questions || questions.length === 0) {
    return res.status(400).json({ message: "Questions required" });
  }

  const quiz = await Quiz.create({
    title,
    topic_id: topicId,
    difficulty,
    num_questions: questions.length,
    owner_user_id: req.user.id,
  });

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    await QuizQuestion.create({
      quiz_id: quiz.id,
      order_index: i,
      question_text: q.question,
      options: q.options,
      correct_option_index: q.correctIndex,
    });
  }

  res.json({ quizId: quiz.id });
});
