import db from "../../config/db.js";
import Student from "./student.model.js";
import AppError from "../../shared/appError.js";
import { logApprovalAction } from "../../shared/utils/auditLogger.js";

/* =========================
   STUDENT: REQUEST UPDATE
========================= */
export const requestStudentProfileUpdateService = async (
  user_id,
  updates
) => {
  const student = await Student.findOne({ where: { user_id } });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  if (student.approval_status === "pending") {
    throw new AppError("Profile update already pending approval", 409);
  }

  await student.update({
    ...updates,
    approval_status: "pending",
    approved_by: null,
    approved_at: null,
    rejection_reason: null, // ✅ IMPORTANT
  });

  return {
    message: "Profile update submitted for teacher approval",
  };
};

/* =========================
   TEACHER: APPROVE / REJECT
========================= */
export const approveStudentProfileService = async ({
  student_id,
  teacher_user_id,
  school_id,
  action,
  remark, // ✅ NOW DEFINED
}) => {
  return db.transaction(async (t) => {
    const student = await Student.findOne({
      where: { id: student_id, school_id },
      transaction: t,
    });

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    if (student.approval_status !== "pending") {
      throw new AppError("No pending approval for this student", 400);
    }

    if (action === "approve") {
      await student.update(
        {
          approval_status: "approved",
          approved_by: teacher_user_id,
          approved_at: new Date(),
          rejection_reason: null,
        },
        { transaction: t }
      );
    }

    if (action === "reject") {
      await student.update(
        {
          approval_status: "rejected",
          approved_by: teacher_user_id,
          approved_at: new Date(),
          rejection_reason: remark,
        },
        { transaction: t }
      );
    }

    // ✅ AUDIT LOG (inside transaction)
    await logApprovalAction({
      entity_type: "student",
      entity_id: student.id,
      action,
      remark,
      performed_by: teacher_user_id,
      transaction: t,
    });

    return {
      student_id,
      status: action,
    };
  });
};
