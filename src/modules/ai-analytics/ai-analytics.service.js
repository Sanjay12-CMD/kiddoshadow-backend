import { Op, fn, col } from "sequelize";
import AiChatLog from "../ai-chat-logs/ai-chat-log.model.js";
import User from "../users/user.model.js";
import Student from "../students/student.model.js";
import Class from "../classes/classes.model.js";

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

export async function getSchoolUserUsage(schoolId, role = "student") {
  return AiChatLog.findAll({
    attributes: [
      "user_id",
      [fn("COUNT", col("ai_chat_log.id")), "total_calls"],
      [fn("SUM", col("tokens_used")), "total_tokens"],
    ],
    include: [
      {
        model: User,
        attributes: ["id", "name", "username", "role", "school_id"],
        where: { school_id: schoolId, role },
      },
    ],
    group: ["ai_chat_log.user_id", "user.id"],
    order: [[fn("SUM", col("tokens_used")), "DESC"]],
    raw: true,
  });
}

export async function getSchoolClassUsage(schoolId) {
  const rows = await AiChatLog.findAll({
    attributes: [
      [col("user->student.class_id"), "class_id"],
      [fn("COUNT", col("ai_chat_log.id")), "total_calls"],
      [fn("SUM", col("tokens_used")), "total_tokens"],
    ],
    include: [
      {
        model: User,
        attributes: [],
        where: { school_id: schoolId, role: "student" },
        include: [
          {
            model: Student,
            attributes: [],
            include: [{ model: Class, attributes: ["id", "class_name"] }],
          },
        ],
      },
    ],
    group: ["user->student.class_id", "user->student->class.id"],
    order: [[fn("SUM", col("tokens_used")), "DESC"]],
    raw: true,
  });

  const classIds = rows
    .map((r) => r.class_id)
    .filter((v) => v !== null && v !== undefined);

  const classes = await Class.findAll({
    where: { id: classIds },
    attributes: ["id", "class_name"],
  });

  const classMap = new Map(classes.map((c) => [String(c.id), c.class_name]));

  return rows.map((r) => ({
    ...r,
    class_name: classMap.get(String(r.class_id)) || null,
  }));
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
