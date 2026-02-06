import GroupChat from "./group-chat.model.js";
import GroupChatMember from "./group-chat-member.model.js";
import GroupChatMessage from "./group-chat-message.model.js";
import Student from "../students/student.model.js";
import db from "../../config/db.js";

/**
 * Create group chat with auto-membership
 * - Teacher is creator
 * - Students are auto-added from section
 */
export async function createGroupChatWithMembers({
  teacherUserId,
  subjectId,
  section,
}) {
  return db.transaction(async (t) => {
    const chat = await GroupChat.create(
      {
        teacher_id: teacherUserId,
        subject_id: subjectId,
        class_id: section.class_id,
        section_id: section.id,
      },
      { transaction: t }
    );

    // add teacher
    await GroupChatMember.create(
      {
        group_chat_id: chat.id,
        user_id: teacherUserId,
        role: "teacher",
      },
      { transaction: t }
    );

    // add students
    const students = await Student.findAll({
      where: { section_id: section.id, school_id: section.school_id },
    });

    for (const student of students) {
      await GroupChatMember.create(
        {
          group_chat_id: chat.id,
          user_id: student.user_id,
          role: "student",
        },
        { transaction: t }
      );
    }

    return chat;
  });
}

/**
 * Check if user is member of chat
 */
export async function isUserMemberOfChat(chatId, userId) {
  const member = await GroupChatMember.findOne({
    where: {
      group_chat_id: chatId,
      user_id: userId,
    },
  });

  return !!member;
}

/**
 * Persist a group chat message
 */
export async function createGroupChatMessage({
  chatId,
  senderUserId,
  messageType,
  messageText,
  imageUrl,
}) {
  return GroupChatMessage.create({
    group_chat_id: chatId,
    sender_user_id: senderUserId,
    message_type: messageType,
    message_text: messageText ?? null,
    image_url: imageUrl ?? null,
  });
}

/**
 * Fetch messages for a chat (pagination-ready)
 */
export async function getGroupChatMessages({
  chatId,
  limit = 50,
  offset = 0,
}) {
  return GroupChatMessage.findAll({
    where: {
      group_chat_id: chatId,
    },
    order: [["created_at", "DESC"]],
    limit,
    offset,
  });
}
