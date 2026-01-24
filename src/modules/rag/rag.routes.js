import express from "express";
import { askQuestion } from "./rag.controller.js";
import auth from "../../shared/middlewares/auth.js";
import { ragRateLimit } from "../../shared/middlewares/rateLimit.js";

const router = express.Router();

// student / teacher / parent can all use this
router.post("/ask", ragRateLimit, auth, askQuestion);

export default router;
