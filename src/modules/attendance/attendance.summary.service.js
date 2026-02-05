import { Op } from "sequelize";
import Attendance from "./attendance.model.js";
import Student from "../students/student.model.js";
import Parent from "../parents/parent.model.js";
import User from "../users/user.model.js";
import Class from "../classes/classes.model.js";
import Section from "../sections/section.model.js";
import AppError from "../../shared/appError.js";
import { getPagination } from "../../shared/utils/pagination.js";

/* =========================
   TEACHER: MARK ATTENDANCE
========================= */
export const markAttendanceService = async ({
  school_id,
  teacher_user_id,
  class_id,
  section_id,
  date,
  records, // [{ student_id, status }]
}) => {
  for (const { student_id, status } of records) {
    const student = await Student.findOne({
      where: {
        id: student_id,
        school_id,
        class_id,
        section_id,
      },
    });

    if (!student) {
      throw new AppError(`Student ${student_id} not found`, 404);
    }

    await Attendance.upsert({
      school_id,
      student_id,
      class_id,
      section_id,
      date,
      status,
      marked_by: teacher_user_id,
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

  const where = { school_id };

  if (class_id) where.class_id = Number(class_id);
  if (section_id) where.section_id = Number(section_id);

  if (from_date || to_date) {
    where.date = {};
    if (from_date) where.date[Op.gte] = from_date;
    if (to_date) where.date[Op.lte] = to_date;
  }

  return Attendance.findAndCountAll({
    where,
    include: [
      {
        model: Student,
        include: [
          { model: User, attributes: ["id", "name"] },
          { model: Class, attributes: ["id", "class_name"] },
          { model: Section, attributes: ["id", "name"] },
        ],
      },
    ],
    limit,
    offset,
    order: [["date", "DESC"]],
  });
};

/* =========================
   PARENT: ATTENDANCE SUMMARY
========================= */
export const getParentAttendanceSummaryService = async ({
  parent_user_id,
  query,
}) => {
  const { limit, offset } = getPagination(query);
  const { from_date, to_date } = query || {};

  const links = await Parent.findAll({
    where: {
      user_id: parent_user_id,
      approval_status: "approved",
    },
    attributes: ["student_id"],
  });

  const studentIds = links.map((l) => l.student_id);
  if (!studentIds.length) {
    return { count: 0, rows: [] };
  }

  const where = {
    student_id: studentIds,
  };

  if (from_date || to_date) {
    where.date = {};
    if (from_date) where.date[Op.gte] = from_date;
    if (to_date) where.date[Op.lte] = to_date;
  }

  return Attendance.findAndCountAll({
    where,
    include: [
      {
        model: Student,
        include: [
          { model: User, attributes: ["id", "name"] },
          { model: Class, attributes: ["id", "class_name"] },
          { model: Section, attributes: ["id", "name"] },
        ],
      },
    ],
    limit,
    offset,
    order: [["date", "DESC"]],
  });
};

/* =========================
   STUDENT: ATTENDANCE SUMMARY
========================= */
export const getStudentAttendanceSummaryService = async ({
  student_user_id,
  query,
}) => {
  const { limit, offset } = getPagination(query);
  const { from_date, to_date } = query || {};

  const student = await Student.findOne({ where: { user_id: student_user_id } });
  if (!student) {
    throw new AppError("Student profile not found", 404);
  }

  const where = {
    student_id: student.id,
  };

  if (from_date || to_date) {
    where.date = {};
    if (from_date) where.date[Op.gte] = from_date;
    if (to_date) where.date[Op.lte] = to_date;
  }

  return Attendance.findAndCountAll({
    where,
    include: [
      {
        model: Student,
        include: [
          { model: User, attributes: ["id", "name"] },
          { model: Class, attributes: ["id", "class_name"] },
          { model: Section, attributes: ["id", "name"] },
        ],
      },
    ],
    limit,
    offset,
    order: [["date", "DESC"]],
  });
};
