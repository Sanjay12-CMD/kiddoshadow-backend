import Student from "../../modules/students/student.model.js";
import Teacher from "../../modules/teachers/teacher.model.js";
import AppError from "../appError.js";

/**
 * Blocks actions if user profile is not approved
 * Applies to roles that require verification
 */
export const approvalGate = async (req, res, next) => {
  const { role, id: user_id, school_id } = req.user;

  // Admins are always allowed
  if (role === "school_admin") return next();

  // STUDENT
  if (role === "student") {
    const student = await Student.findOne({
      where: { user_id, school_id },
    });

    if (!student) {
      throw new AppError("Student profile not found", 404);
    }

    if (student.approval_status !== "approved") {
      throw new AppError(
        "Student profile pending teacher approval",
        403
      );
    }
  }

  // TEACHER
  if (role === "teacher") {
    const teacher = await Teacher.findOne({
      where: { user_id, school_id },
    });

    if (!teacher) {
      throw new AppError("Teacher profile not found", 404);
    }

    if (teacher.approval_status !== "approved") {
      throw new AppError(
        "Teacher profile pending admin approval",
        403
      );
    }
  }

  // PARENTS are allowed basic access without approval
  // (parent approval already handled at creation)

  next();
};


