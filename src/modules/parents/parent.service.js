import db from "../../config/db.js";
import User from "../users/user.model.js";
import Parent from "./parent.model.js";
import Student from "../students/student.model.js";
import AppError from "../../shared/appError.js";
import { getPagination } from "../../shared/utils/pagination.js";

/* =========================
   ADMIN: CREATE PARENT + LINK
========================= */
export const createParentAndLinkService = async ({
  school_id,
  student_id,
  relation_type = "guardian",
}) => {
  if (!student_id) {
    throw new AppError("student_id is required", 400);
  }
  


  return db.transaction(async (t) => {
    /**
     * 1️⃣ Validate student
     */
    const student = await Student.findOne({
      where: { id: student_id, school_id },
      transaction: t,
    });

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    /**
     * 2️⃣ Generate deterministic username
     */
    const username = `PAR-${school_id}-${student_id}`;
    const password = `${username}@123`;

    /**
     * 3️⃣ Ensure parent user does not already exist
     */
    const existingUser = await User.findOne({
      where: { school_id, username },
      transaction: t,
    });

    if (existingUser) {
      throw new AppError("Parent already exists for this student", 409);
    }

    /**
     * 4️⃣ Create parent user
     */
    const user = await User.create(
      {
        role: "parent",
        school_id,
        username,
        password,
        first_login: true,
        is_active: true,
        name: "Parent",
      },
      { transaction: t }
    );

    /**
     * 5️⃣ Create parent profile + link
     */
    const parent = await Parent.create(
      {
        user_id: user.id,
        student_id,
        relation_type,
        approval_status: "pending",
        is_active: true,
      },
      { transaction: t }
    );

    /**
     * 6️⃣ Return admin-safe response
     */
    return {
      parent_id: parent.id,
      username,
      student_id,
      relation_type,
      password_hint: "username@123",
    };
  });
};
/* =========================
   ADMIN: LINK EXISTING PARENT
========================= */
export const linkExistingParentService = async ({
  parent_user_id,
  student_id,
  relation_type = "guardian",
  school_id,
}) => {

  return db.transaction(async (t) => {
    const user = await User.findOne({
      where: { id: parent_user_id, role: "parent", school_id },
      transaction: t,
    });

    if (!user) throw new AppError("Parent user not found", 404);

    const student = await Student.findOne({
      where: { id: student_id, school_id },
      transaction: t,
    });

    if (!student) throw new AppError("Student not found", 404);

    const exists = await Parent.findOne({
      where: { user_id: user.id, student_id },
      transaction: t,
    });

    if (exists) {
      throw new AppError("Parent already linked to this student", 409);
    }

    await Parent.create(
      {
        user_id: user.id,
        student_id,
        relation_type,
      },
      { transaction: t }
    );

    return { parent_user_id, student_id };
  });
};

/* =========================
   PARENT: UPDATE OWN PROFILE
========================= */
export const updateParentProfileService = async (user_id, data) => {
  const user = await User.findByPk(user_id);

  if (!user || user.role !== "parent") {
    throw new AppError("Parent not found", 404);
  }

  await user.update(data);
  return user;
};

/* =========================
   ADMIN: LIST PARENTS (SCHOOL)
========================= */
export const listParentsService = async ({ school_id, query }) => {
  const { limit, offset } = getPagination(query);
  const safeQuery = query || {};

  const where = {};
  const status = safeQuery.approval_status;
  if (["pending", "approved", "rejected"].includes(status)) {
    where.approval_status = status;
  }

  return Parent.findAndCountAll({
    where,
    include: [
      {
        model: User,
        required: true,
        where: { school_id },
        attributes: ["id", "username", "name", "phone", "is_active"],
      },
      {
        model: Student,
        required: true,
        where: { school_id },
        attributes: ["id", "class_id", "section_id", "user_id"],
      },
    ],
    limit,
    offset,
    distinct: true,
    order: [["created_at", "DESC"]],
  });
};
