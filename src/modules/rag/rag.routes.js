import express from "express";
import { askQuestion } from "./rag.controller.js";
import auth from "../../shared/middlewares/auth.js";

const router = express.Router();

// student / teacher / parent can all use this
router.post("/ask", auth, askQuestion);

export default router;
