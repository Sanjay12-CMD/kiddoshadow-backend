import Teacher from "./teacher.model.js";
import User from "../users/user.model.js";
import AppError from "../../shared/appError.js";

/* =========================
   TEACHER: REQUEST UPDATE
========================= */
export const requestTeacherProfileUpdateService = async (
  user_id,
  updates
) => {
  const teacher = await Teacher.findOne({ where: { user_id } });

  if (!teacher) {
    throw new AppError("Teacher not found", 404);
  }

  if (teacher.approval_status === "pending") {
    throw new AppError("Profile update already pending approval", 409);
  }

  await teacher.update({
    ...updates,
    approval_status: "pending",
    approved_by: null,
    approved_at: null,
  });

  return {
    message: "Profile update submitted for admin approval",
  };
};

/* =========================
   ADMIN: APPROVE / REJECT
========================= */
export const approveTeacherProfileService = async ({
  teacher_id,
  admin_user_id,
  school_id,
  action,
}) => {
  const teacher = await Teacher.findOne({
    where: { id: teacher_id, school_id },
  });

  if (!teacher) {
    throw new AppError("Teacher not found", 404);
  }

  if (teacher.approval_status !== "pending") {
    throw new AppError("No pending approval for this teacher", 400);
  }

  if (action === "approve") {
    await teacher.update({
      approval_status: "approved",
      approved_by: admin_user_id,
      approved_at: new Date(),
    });

    // Optional: activate teacher user on approval
    await User.update(
      { is_active: true },
      { where: { id: teacher.user_id } }
    );
  }

  if (action === "reject") {
    await teacher.update({
      approval_status: "rejected",
      approved_by: admin_user_id,
      approved_at: new Date(),
    });
  }

  return {
    teacher_id,
    status: action,
  };
};
