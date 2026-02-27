import db from "../../config/db.js";
import User from "../users/user.model.js";
import Parent from "./parent.model.js";
import Student from "../students/student.model.js";
import AppError from "../../shared/appError.js";
import TeacherAssignment from "../teacher-assignments/teacher-assignment.model.js";

/* =========================
   TEACHER: CREATE PARENT (PENDING)
========================= */
export const teacherCreateParentService = async ({
  teacher_school_id,
  username,
  student_id,
  relation_type,
}) => {
  return db.transaction(async (t) => {
    const student = await Student.findOne({
      where: { id: student_id, school_id: teacher_school_id },
      transaction: t,
    });

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    let user = await User.findOne({
      where: { username, school_id: teacher_school_id },
      transaction: t,
    });

    if (!user) {
      user = await User.create(
        {
          role: "parent",
          school_id: teacher_school_id,
          username,
          password: username,
          first_login: true,
          is_active: false, // IMPORTANT
          name: "Parent",
        },
        { transaction: t }
      );
    }

    const exists = await Parent.findOne({
      where: { user_id: user.id, student_id },
      transaction: t,
    });

    if (exists) {
      throw new AppError("Parent already linked to this student", 409);
    }

    const parent = await Parent.create(
      {
        user_id: user.id,
        student_id,
        relation_type,
        approval_status: "pending",
      },
      { transaction: t }
    );

    return {
      parent_id: parent.id,
      message: "Parent created and sent for admin approval",
    };
  });
};

/* =========================
   ADMIN: APPROVE / REJECT
========================= */
export const approveParentService = async ({
  parent_id,
  actor_user_id,
  actor_role,
  school_id,
  teacher_id,
  action,
}) => {
  return db.transaction(async (t) => {
    const parent = await Parent.findByPk(parent_id, {
      transaction: t,
    });

    if (!parent) {
      throw new AppError("Parent link not found", 404);
    }

    const user = await User.findOne({
      where: { id: parent.user_id, school_id },
      transaction: t,
    });

    if (!user) {
      throw new AppError("Parent user not found", 404);
    }

    if (actor_role === "teacher") {
      const student = await Student.findOne({
        where: { id: parent.student_id, school_id },
        transaction: t,
      });
      if (!student) {
        throw new AppError("Linked student not found", 404);
      }

      const classTeacherAssignment = await TeacherAssignment.findOne({
        where: {
          school_id,
          teacher_id,
          section_id: student.section_id,
          is_class_teacher: true,
          is_active: true,
        },
        transaction: t,
      });

      if (!classTeacherAssignment) {
        throw new AppError("Only class teacher can approve this parent", 403);
      }
    } else if (actor_role !== "school_admin") {
      throw new AppError("Unauthorized role", 403);
    }

    if (parent.approval_status !== "pending") {
      throw new AppError("No pending approval", 400);
    }

    if (action === "approve") {
      await parent.update(
        {
          approval_status: "approved",
          approved_by: actor_user_id,
          approved_at: new Date(),
        },
        { transaction: t }
      );

      await user.update(
        { is_active: true },
        { transaction: t }
      );
    }

    if (action === "reject") {
      await parent.update(
        {
          approval_status: "rejected",
          approved_by: actor_user_id,
          approved_at: new Date(),
        },
        { transaction: t }
      );
    }

    return {
      parent_id,
      status: action,
    };
  });
};
