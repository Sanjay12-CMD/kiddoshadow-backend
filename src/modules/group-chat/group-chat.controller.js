// src/modules/group-chat/group-chat.controller.js
import GroupChat from "./group-chat.model.js";
import GroupChatMember from "./group-chat-member.model.js";
import GroupChatMessage from "./group-chat-message.model.js";
import User from "../users/user.model.js";
import Student from "../students/student.model.js";
import Teacher from "../teachers/teacher.model.js";
import Class from "../classes/classes.model.js";
import Section from "../sections/section.model.js";
import Subject from "../subjects/subject.model.js";
import AppError from "../../shared/appError.js";
import asyncHandler from "../../shared/asyncHandler.js";
import db from "../../config/db.js";

/**
 * CREATE GROUP CHAT
 * - Teacher only
 * - One chat per (teacher + subject + section)
 * - Auto-add teacher + all students in section
 */
export const createGroupChat = asyncHandler(async (req, res) => {
  const { subjectId, sectionId } = req.body;
  const userId = req.user.id;

  const teacher = await Teacher.findOne({ where: { user_id: userId } });
  if (!teacher) {
    throw new AppError("Only teachers can create group chats", 403);
  }

  const section = await Section.findByPk(sectionId);
  if (!section) {
    throw new AppError("Section not found", 404);
  }

  const subject = await Subject.findByPk(subjectId);
  if (!subject) {
    throw new AppError("Subject not found", 404);
  }

  const existing = await GroupChat.findOne({
    where: {
      teacher_id: userId,
      subject_id: subjectId,
      section_id: sectionId,
    },
  });

  if (existing) {
    return res.json({ chatId: existing.id });
  }

  const students = await Student.findAll({
    where: { section_id: sectionId },
  });

  const chat = await db.transaction(async (t) => {
    const createdChat = await GroupChat.create(
      {
        teacher_id: userId,
        subject_id: subjectId,
        class_id: section.class_id,
        section_id: sectionId,
      },
      { transaction: t }
    );

    await GroupChatMember.create(
      {
        group_chat_id: createdChat.id,
        user_id: userId,
        role: "teacher",
      },
      { transaction: t }
    );

    for (const student of students) {
      await GroupChatMember.create(
        {
          group_chat_id: createdChat.id,
          user_id: student.user_id,
          role: "student",
        },
        { transaction: t }
      );
    }

    return createdChat;
  });

  res.json({ chatId: chat.id });
});

/**
 * LIST GROUP CHATS FOR USER
 * - Teacher: chats they created
 * - Student: chats for their section
 */
export const listGroupChats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const memberships = await GroupChatMember.findAll({
    where: { user_id: userId },
    include: [
      {
        model: GroupChat,
        include: [
          { model: Subject, attributes: ["id", "name"] },
          { model: Class, attributes: ["id", "class_name"] },
          { model: Section, attributes: ["id", "name"] },
        ],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  const chats = memberships.map((m) => ({
    chatId: m.group_chat_id,
    role: m.role,
    subject: m.GroupChat.Subject,
    class: m.GroupChat.Class,
    section: m.GroupChat.Section,
    created_at: m.created_at, // useful for sorting
  }));

  res.json(chats);
});

/**
 * LIST MESSAGES FOR A GROUP
 */
export const getGroupMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id;

  // Check membership
  const member = await GroupChatMember.findOne({
    where: { group_chat_id: chatId, user_id: userId },
  });

  if (!member && req.user.role !== "school_admin") {
    throw new AppError("You are not a member of this chat", 403);
  }

  const messages = await GroupChatMessage.findAll({
    where: { group_chat_id: chatId },
    include: [
      {
        model: User,
        attributes: ["id", "name", "avatar"],
        as: "Sender",
      },
    ],
    order: [["created_at", "ASC"]],
  });

  const mapped = messages.map((m) => ({
    id: m.id,
    sender_id: m.sender_user_id,
    sender_name: m.Sender ? m.Sender.name : "Unknown",
    avatar: m.Sender ? m.Sender.avatar : null,
    content: m.message_text || m.image_url,
    type: m.message_type,
    created_at: m.created_at,
  }));

  res.json(mapped);
});
