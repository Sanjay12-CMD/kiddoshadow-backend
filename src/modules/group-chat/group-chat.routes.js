import express from "express";
import { createGroupChat, listGroupChats, getGroupMessages, deleteGroupChat } from "./group-chat.controller.js";
import { protect } from "../../shared/middlewares/auth.js";
import { schoolScope } from "../../shared/middlewares/schoolScope.js";
import { allowRoles } from "../../shared/middlewares/role.js";

const router = express.Router();


router.use(protect, schoolScope);

/**
 * Teacher creates group chat
 */
router.post("/", allowRoles("teacher"), createGroupChat);

/**
 * List group chats for logged-in user
 */
router.get("/", listGroupChats);

/**
 * Delete group chat (teacher owner or school_admin)
 */
router.delete("/:chatId", allowRoles("teacher", "school_admin"), deleteGroupChat);

/**
 * Get messages
 */
router.get("/:chatId/messages", getGroupMessages);

export default router;
