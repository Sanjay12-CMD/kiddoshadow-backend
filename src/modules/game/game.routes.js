import { submitSinglePlayerQuiz } from "./game.controller.js";

router.post(
  "/quiz/single/submit",
  auth,
  submitSinglePlayerQuiz
);