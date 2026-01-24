import express from "express";
import { createGroupChat, listGroupChats } from "./group-chat.controller.js";
import auth from "../../shared/middlewares/auth.js";
import schoolScope from "../../shared/middlewares/schoolScope.js";

const router = express.Router();


router.use(auth, schoolScope);

/**
 * Teacher creates group chat
 */
router.post("/", createGroupChat);

/**
 * List group chats for logged-in user
 */
router.get("/", listGroupChats);

export default router;
