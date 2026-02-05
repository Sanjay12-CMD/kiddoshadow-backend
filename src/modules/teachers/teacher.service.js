import db from "../../config/db.js";
import User from "../users/user.model.js";
import Teacher from "./teacher.model.js";
import AppError from "../../shared/appError.js";
import { getPagination } from "../../shared/utils/pagination.js";

/* =========================
   ADMIN: CREATE TEACHER
========================= */
export const createTeacherService = async ({ school_id }) => {
  return db.transaction(async (t) => {
    /**
     * 1️⃣ Get next serial (school-level)
     */
    const count = await Teacher.count({
      where: { school_id },
      transaction: t,
    });

    const serial = count + 1;
    const username = `TCH-${school_id}-${String(serial).padStart(3, "0")}`;
    const password = `${username}@123`;

    /**
     * 2️⃣ Safety check (extremely unlikely, but correct)
     */
    const exists = await User.findOne({
      where: { school_id, username },
      transaction: t,
    });

    if (exists) {
      throw new AppError("Generated teacher username already exists", 409);
    }

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
