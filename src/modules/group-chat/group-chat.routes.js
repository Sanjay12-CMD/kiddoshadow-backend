import express from "express";
import { createGroupChat, listGroupChats, getGroupMessages } from "./group-chat.controller.js";
import { protect } from "../../shared/middlewares/auth.js";
import { schoolScope } from "../../shared/middlewares/schoolScope.js";

const router = express.Router();


router.use(protect, schoolScope);

/**
 * Teacher creates group chat
 */
router.post("/", createGroupChat);

/**
 * List group chats for logged-in user
 */
router.get("/", listGroupChats);

/**
 * Get messages
 */
router.get("/:chatId/messages", getGroupMessages);

export default router;
