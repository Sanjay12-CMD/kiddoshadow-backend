import User from "../users/user.model.js";
import Teacher from "./teacher.model.js";
import AppError from "../../shared/appError.js";
import { getPagination } from "../../shared/utils/pagination.js";

/* =========================
   ADMIN: CREATE TEACHER
========================= */
export const createTeacherService = async ({ school_id, username }) => {
  const exists = await User.findOne({
    where: { school_id, username },
  });

  if (exists) {
    throw new AppError("Username already exists", 409);
  }
  // generate employee id (simple + safe)
  const count = await Teacher.count({ where: { school_id } });
  const employee_id = `EMP${String(count + 1).padStart(4, "0")}`;

  const user = await User.create({
    role: "teacher",
    school_id,
    username,
    password: username,
    first_login: true,
    is_active: true,
    name: "Teacher",
  });

  const teacher = await Teacher.create({
    user_id: user.id,
    school_id,
    employee_id,
    joining_date: new Date(),
  });

  return {
    username: user.username,
    employee_id: teacher.employee_id,
  };
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
