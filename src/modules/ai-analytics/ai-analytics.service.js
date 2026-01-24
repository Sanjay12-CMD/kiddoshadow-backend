import { Op, fn, col } from "sequelize";
import AiChatLog from "../ai-chat-logs/ai-chat-log.model.js";
import User from "../users/user.model.js";

/* ===================== SCHOOL ===================== */

export async function getSchoolAnalytics(schoolId) {
  return AiChatLog.findAll({
    attributes: [
      [fn("COUNT", col("ai_chat_log.id")), "total_calls"],
      [fn("SUM", col("tokens_used")), "total_tokens"],
      [col("user.role"), "role"],
    ],
    include: [
      {
        model: User,
        attributes: [],
        where: { school_id: schoolId },
      },
    ],
    group: ["user.role"],
    raw: true,
  });
}

/* ===================== TEACHER ===================== */

export async function getTeacherAnalytics(teacherUserId) {
  return AiChatLog.findAll({
    attributes: [
      "ai_type",
      [fn("COUNT", col("id")), "calls"],
      [fn("SUM", col("tokens_used")), "tokens"],
    ],
    where: { user_id: teacherUserId },
    group: ["ai_type"],
    order: [[fn("SUM", col("tokens_used")), "DESC"]],
    raw: true,
  });
}

/* ===================== STUDENT ===================== */

export async function getStudentDailyUsage(studentUserId) {
  return AiChatLog.findAll({
    attributes: [
      [fn("DATE", col("created_at")), "date"],
      [fn("SUM", col("tokens_used")), "tokens"],
    ],
    where: { user_id: studentUserId },
    group: [fn("DATE", col("created_at"))],
    order: [[fn("DATE", col("created_at")), "ASC"]],
    raw: true,
  });
}
