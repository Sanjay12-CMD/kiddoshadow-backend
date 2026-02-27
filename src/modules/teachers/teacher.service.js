import db from "../../config/db.js";
import User from "../users/user.model.js";
import Teacher from "./teacher.model.js";
import TeacherAssignment from "../teacher-assignments/teacher-assignment.model.js";
import Class from "../classes/classes.model.js";
import Section from "../sections/section.model.js";
import AppError from "../../shared/appError.js";
import { getPagination } from "../../shared/utils/pagination.js";

/* =========================
   ADMIN: CREATE TEACHER
========================= */
export const createTeacherService = async ({ school_id, class_id, section_id }) => {
  return db.transaction(async (t) => {
    /**
     * 1️⃣ Get next serial (school-level)
     */
    const count = await Teacher.count({
      where: { school_id },
      transaction: t,
    });

    let serial = count + 1;
    let username = `TCH-${school_id}-${String(serial).padStart(3, "0")}`;

    /**
     * 2️⃣ Safety check (extremely unlikely, but correct)
     */
    while (true) {
      const exists = await User.findOne({
        where: { school_id, username },
        transaction: t,
      });
      if (!exists) break;
      serial += 1;
      username = `TCH-${school_id}-${String(serial).padStart(3, "0")}`;
    }

    const password = `${username}@123`;

    /**
     * 3️⃣ Create user
     */
    const user = await User.create(
      {
        role: "teacher",
        school_id,
        username,
        password,
        first_login: true,
        is_active: true,
        name: "Teacher",
      },
      { transaction: t }
    );

    /**
     * 4️⃣ Create teacher profile
     */
    const teacher = await Teacher.create(
      {
        user_id: user.id,
        school_id,
        employee_id: `EMP-${username}`,
        joining_date: new Date(),
        approval_status: "pending",
        is_active: true,
      },
      { transaction: t }
    );

    if (class_id || section_id) {
      const classIdNum = Number(class_id);
      const sectionIdNum = Number(section_id);

      if (!Number.isFinite(classIdNum) || !Number.isFinite(sectionIdNum)) {
        throw new AppError("class_id and section_id are required to assign teacher", 400);
      }

      const [cls, section] = await Promise.all([
        Class.findOne({
          where: { id: classIdNum, school_id },
          transaction: t,
        }),
        Section.findOne({
          where: { id: sectionIdNum, class_id: classIdNum, school_id },
          transaction: t,
        }),
      ]);

      if (!cls) throw new AppError("Class not found", 404);
      if (!section) throw new AppError("Section not found", 404);

      await TeacherAssignment.create(
        {
          school_id,
          teacher_id: teacher.id,
          class_id: classIdNum,
          section_id: sectionIdNum,
          subject_id: null,
          is_active: true,
          is_class_teacher: false,
        },
        { transaction: t }
      );
    }

    /**
     * 5️⃣ Return admin-safe response
     */
    return {
      teacher_id: teacher.id,
      username,
      employee_id: teacher.employee_id,
      password_hint: "username@123",
    };
  });
};
/* =========================
   ADMIN: LIST TEACHERS
========================= */

export const listTeachersService = async ({ school_id, query }) => {
  const { limit, offset } = getPagination(query);

  return Teacher.findAndCountAll({
    where: { school_id },
    limit,
    offset,
    include: [
      {
        model: User,
        attributes: ["id", "username", "name", "is_active"],
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

/* =========================
   ADMIN: OPTIONS (DROPDOWN)
========================= */
export const listTeacherOptionsService = async ({ school_id }) => {
  return Teacher.findAll({
    where: { school_id },
    include: [
      {
        model: User,
        attributes: ["id", "username", "name", "is_active"],
      },
    ],
    attributes: ["id", "user_id", "employee_id", "approval_status", "is_active"],
    order: [[User, "username", "ASC"]],
  });
};

/* =========================
   ADMIN: LIST TEACHERS BY SECTION
========================= */
export const listTeachersBySectionService = async ({ school_id, section_id }) => {
  const sectionIdNum = Number(section_id);
  if (!Number.isFinite(sectionIdNum)) {
    throw new AppError("Invalid section id", 400);
  }

  const rows = await Teacher.findAll({
    where: { school_id },
    include: [
      {
        model: User,
        attributes: ["id", "username", "name", "is_active"],
      },
      {
        model: TeacherAssignment,
        attributes: ["id", "section_id", "class_id", "subject_id", "is_active"],
        where: {
          school_id,
          section_id: sectionIdNum,
          is_active: true,
        },
        required: true,
      },
    ],
    order: [[User, "username", "ASC"]],
  });

  return rows;
};

/* =========================
   ADMIN: STATUS
========================= */
export const updateTeacherStatusService = async ({
  teacher_id,
  is_active,
  school_id,
}) => {
  const teacher = await Teacher.findOne({
    where: { id: teacher_id, school_id },
  });

  if (!teacher) {
    throw new AppError("Teacher not found", 404);
  }

  teacher.is_active = is_active;
  await teacher.save();

  await User.update(
    { is_active },
    { where: { id: teacher.user_id } }
  );

  return teacher;
};
