import User from "../users/user.model.js";
import Student from "./student.model.js";
import Class from "../classes/classes.model.js";
import Section from "../sections/section.model.js";
import TeacherAssignment from "../teacher-assignments/teacher-assignment.model.js";
import AppError from "../../shared/appError.js";
import { getPagination } from "../../shared/utils/pagination.js";
import db from "../../config/db.js";

/* =========================
   ADMIN:  CREATE STDUENT
========================= */
export const createStudentService = async ({
  school_id,
  class_id,
  section_id,
}) => {
  if (!section_id || !class_id) {
    throw new AppError("class_id and section_id are required", 400);
  }

  return db.transaction(async (t) => {
    /**
     * 1️⃣ Validate section
     */
    const section = await Section.findOne({
      where: {
        id: section_id,
        class_id,
        school_id,
        is_active: true,
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!section) {
      throw new AppError("Section not found or inactive", 404);
    }

    /**
     * 2️⃣ Generate serial (school-level, consistent with bulk)
     */
    const baseSerial = await Student.count({
      where: { school_id },
      transaction: t,
    });

    const serial = baseSerial + 1;
    const username = `STU-${school_id}-${section_id}-${String(serial).padStart(3, "0")}`;
    const password = `${username}@123`;

    /**
     * 3️⃣ Ensure username uniqueness
     */
    const exists = await User.findOne({
      where: { school_id, username },
      transaction: t,
    });

    if (exists) {
      throw new AppError("Generated username already exists", 409);
    }

    /**
     * 4️⃣ Create user
     */
    const user = await User.create(
      {
        role: "student",
        school_id,
        username,
        password,
        first_login: true,
        is_active: true,
        name: "Student",
      },
      { transaction: t }
    );

    /**
     * 5️⃣ Create student profile
     */
    const student = await Student.create(
      {
        user_id: user.id,
        school_id,
        class_id,
        section_id,
        admission_no: `ADM-${username}`,
        approval_status: "pending",
        is_active: true,
      },
      { transaction: t }
    );

    /**
     * 6️⃣ Return minimal response
     */
    return {
      student_id: student.id,
      username,
      class_id,
      section_id,
      password_hint: "username@123",
    };
  });
};
/* =========================
   ADMIN: LIST
========================= */


export const listStudentsService = async ({ school_id, query }) => {
  const { limit, offset } = getPagination(query);
  const where = { school_id };

  if (query?.class_id) where.class_id = Number(query.class_id);
  if (query?.section_id) where.section_id = Number(query.section_id);

  return Student.findAndCountAll({
    where,
    limit,
    offset,
    include: [
      { model: User, attributes: ["id", "username", "name", "is_active"] },
      { model: Class, attributes: ["id", "class_name"] },
      { model: Section, attributes: ["id", "name"] },
    ],
    order: [["created_at", "DESC"]],
  });
};

/* =========================
   ADMIN: OPTIONS (DROPDOWN)
========================= */
export const listStudentOptionsService = async ({ school_id, query }) => {
  const where = { school_id };

  if (query?.class_id) where.class_id = Number(query.class_id);
  if (query?.section_id) where.section_id = Number(query.section_id);

  return Student.findAll({
    where,
    include: [
      { model: User, attributes: ["id", "username", "name", "is_active"] },
      { model: Class, attributes: ["id", "class_name"] },
      { model: Section, attributes: ["id", "name"] },
    ],
    attributes: ["id", "class_id", "section_id", "roll_no", "admission_no"],
    order: [[User, "username", "ASC"]],
  });
};

// Teacher scoped students (by their assignments)
export const listStudentsForTeacherSectionService = async ({ user, query }) => {
  const assignments = await TeacherAssignment.findAll({
    where: { teacher_id: user.teacher_id, school_id: user.school_id, is_active: true },
    attributes: ["class_id", "section_id"],
  });

  const allowedSectionIds = [...new Set(assignments.map((a) => a.section_id))];
  const allowedClassIds = [...new Set(assignments.map((a) => a.class_id))];

  if (!allowedSectionIds.length) return [];

  const where = {
    school_id: user.school_id,
    section_id: allowedSectionIds,
    class_id: allowedClassIds,
  };

  if (query?.class_id) where.class_id = Number(query.class_id);
  if (query?.section_id) where.section_id = Number(query.section_id);

  const students = await Student.findAll({
    where,
    include: [
      { model: User, attributes: ["id", "username", "name"] },
      { model: Class, attributes: ["id", "class_name"] },
      { model: Section, attributes: ["id", "name"] },
    ],
    attributes: ["id", "class_id", "section_id", "roll_no", "admission_no"],
    order: [[User, "username", "ASC"]],
  });

  return students;
};

/* =========================
   ADMIN: MOVE
========================= */
export const moveStudentService = async ({
  student_id,
  section_id,
  school_id,
}) => {
  const student = await Student.findOne({
    where: { id: student_id, school_id },
  });
  if (!student) throw new AppError("Student not found", 404);

  student.section_id = section_id;
  await student.save();
  return student;
};

/* =========================
   ADMIN: STATUS
========================= */
export const updateStudentStatusService = async ({
  student_id,
  is_active,
  school_id,
}) => {
  const student = await Student.findOne({
    where: { id: student_id, school_id },
  });
  if (!student) throw new AppError("Student not found", 404);

  student.is_active = is_active;
  await student.save();
  return student;
};


//Bulk student update to sections

export const assignStudentsToSectionService = async ({
  school_id,
  target_class_id,
  target_section_id,
  students,
}) => {
  return db.transaction(async (t) => {
    // 1. Validate class
    const cls = await Class.findOne({
      where: { id: target_class_id, school_id },
      transaction: t,
    });

    if (!cls) {
      return { error: "CLASS_NOT_FOUND" };
    }

    // 2. Validate section
    const section = await Section.findOne({
      where: {
        id: target_section_id,
        class_id: target_class_id,
        school_id,
        is_active: true,
      },
      transaction: t,
    });

    if (!section) {
      return { error: "SECTION_NOT_FOUND" };
    }

    // Update students
    for (const s of students) {
      await Student.update(
        {
          class_id: target_class_id,
          section_id: target_section_id,
          roll_no: s.roll_no,
        },
        {
          where: {
            id: s.student_id,
            school_id,
          },
          transaction: t,
        }
      );
    }

    return { success: true };
  });
};
