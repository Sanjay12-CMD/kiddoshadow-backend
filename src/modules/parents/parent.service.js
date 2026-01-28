import db from "../../config/db.js";
import User from "../users/user.model.js";
import Parent from "./parent.model.js";
import Student from "../students/student.model.js";
import AppError from "../../shared/appError.js";

/* =========================
   ADMIN: CREATE PARENT + LINK
========================= */
export const createParentAndLinkService = async ({
  school_id,
  username,
  links,
}) => {
  return db.transaction(async (t) => {
    const exists = await User.findOne({
      where: { username, school_id },
      transaction: t,
    });

    if (exists) {
      throw new AppError("Username already exists", 409);
    }

    const user = await User.create(
      {
        role: "parent",
        school_id,
        username,
        password: username,
        first_login: true,
        is_active: true,
        name: "Parent",
      },
      { transaction: t }
    );

    for (const { student_id, relation_type } of links) {
      const student = await Student.findOne({
        where: { id: student_id, school_id },
        transaction: t,
      });

      if (!student) {
        throw new AppError(`Student ${student_id} not found`, 404);
      }

      await Parent.create(
        {
          user_id: user.id,
          student_id,
          relation_type,
        },
        { transaction: t }
      );
    }

    return {
      user_id: user.id,
      username: user.username,
      linked_students: links,
    };
  });
};

/* =========================
   ADMIN: LINK EXISTING PARENT
========================= */
export const linkExistingParentService = async ({
  parent_user_id,
  student_id,
  relation_type,
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
