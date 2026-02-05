import { Op } from "sequelize";
import Attendance from "./attendance.model.js";
import Student from "../students/student.model.js";
import Parent from "../parents/parent.model.js";
import User from "../users/user.model.js";
import Class from "../classes/classes.model.js";
import Section from "../sections/section.model.js";
import AppError from "../../shared/appError.js";
import { getPagination } from "../../shared/utils/pagination.js";
import TeacherClassSession from "../teacher-class-sessions/teacher-class-session.model.js";

/* =========================
   TEACHER: MARK ATTENDANCE
========================= */
export const markAttendanceService = async ({
  user,
  school_id,
  teacher_class_session_id,
  records, // [{ student_id, status }]
}) => {
  // 1️⃣ Validate session
  const session = await TeacherClassSession.findOne({
    where: {
      id: teacher_class_session_id,
      school_id,
      ended_at: null,
    },
  });

  if (!session) {
    throw new AppError("SESSION_NOT_ACTIVE", 400);
  }

  // 2️⃣ Permission check
  if (user.role === "teacher" && session.teacher_id !== user.teacher_id) {
    throw new AppError("FORBIDDEN", 403);
  }

  // 3️⃣ Mark attendance
  for (const { student_id, status } of records) {
    const student = await Student.findOne({
      where: {
        id: student_id,
        school_id,
        class_id: session.class_id,
        section_id: session.section_id,
        is_active: true,
      },
    });

    if (!student) {
      throw new AppError(`INVALID_STUDENT ${student_id}`, 400);
    }

    await Attendance.upsert({
      school_id,
      teacher_class_session_id,
      student_id,
      status,
      marked_by: user.id,
    });
  }

  return { message: "Attendance marked successfully" };
};

/* =========================
   TEACHER: ATTENDANCE SUMMARY
========================= */
export const getTeacherAttendanceSummaryService = async ({
  school_id,
  query,
}) => {
  const { limit, offset } = getPagination(query);
  const { from_date, to_date, class_id, section_id } = query || {};

  const sessionWhere = { school_id };

  if (class_id) sessionWhere.class_id = Number(class_id);
  if (section_id) sessionWhere.section_id = Number(section_id);

  if (from_date || to_date) {
    sessionWhere.started_at = {};
    if (from_date) sessionWhere.started_at[Op.gte] = from_date;
    if (to_date) sessionWhere.started_at[Op.lte] = to_date;
  }

  return Attendance.findAndCountAll({
    include: [
      {
        model: TeacherClassSession,
        where: sessionWhere,
      },
      {
        model: Student,
        include: [
          { model: User, attributes: ["id", "name"] },
        ],
      },
    ],
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });
};

/* =========================
   PARENT: ATTENDANCE SUMMARY
========================= */export const getParentAttendanceSummaryService = async ({
  parent_user_id,
  query,
}) => {
  const { limit, offset } = getPagination(query);
  const { from_date, to_date } = query || {};

  const links = await Parent.findAll({
    where: { user_id: parent_user_id, approval_status: "approved" },
    attributes: ["student_id"],
  });

  const studentIds = links.map((l) => l.student_id);
  if (!studentIds.length) return { count: 0, rows: [] };

  const sessionWhere = {};

  if (from_date || to_date) {
    sessionWhere.started_at = {};
    if (from_date) sessionWhere.started_at[Op.gte] = from_date;
    if (to_date) sessionWhere.started_at[Op.lte] = to_date;
  }

  return Attendance.findAndCountAll({
    where: { student_id: studentIds },
    include: [
      {
        model: TeacherClassSession,
        where: sessionWhere,
      },
      {
        model: Student,
        include: [{ model: User, attributes: ["id", "name"] }],
      },
    ],
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });
};


/* =========================
   STUDENT: ATTENDANCE SUMMARY
========================= */export const getStudentAttendanceSummaryService = async ({
  student_user_id,
  query,
}) => {
  const { limit, offset } = getPagination(query);
  const { from_date, to_date } = query || {};

  const student = await Student.findOne({ where: { user_id: student_user_id } });
  if (!student) throw new AppError("Student profile not found", 404);

  const sessionWhere = {};

  if (from_date || to_date) {
    sessionWhere.started_at = {};
    if (from_date) sessionWhere.started_at[Op.gte] = from_date;
    if (to_date) sessionWhere.started_at[Op.lte] = to_date;
  }

  return Attendance.findAndCountAll({
    where: { student_id: student.id },
    include: [
      {
        model: TeacherClassSession,
        where: sessionWhere,
      },
    ],
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });
};
