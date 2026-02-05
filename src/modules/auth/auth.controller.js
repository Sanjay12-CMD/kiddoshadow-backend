import jwt from "jsonwebtoken";
import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import User from "../users/user.model.js";
import School from "../schools/school.model.js";

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body; // already validated by Zod

  const user = await User.findOne({ where: { username } });
  if (!user) {
    throw new AppError("Username not found", 401);
  }

  if (!user.is_active) {
    throw new AppError("User account disabled", 403);
  }

  if (password !== user.password) {
    throw new AppError("Password is wrong", 401);
  }

  // school check (except super admin)
  if (user.role !== "super_admin") {
    const school = await School.findByPk(user.school_id);
    if (!school || school.status !== "active") {
      throw new AppError("School is inactive", 403);
    }
  }

  // For students, fetch class/section info
  let additionalClaims = {};
  if (user.role === "student") {

    const Student = (await import("../students/student.model.js")).default;
    const student = await Student.findOne({ where: { user_id: user.id } });

    if (student) {
      additionalClaims = {
        class_id: student.class_id,
        section_id: student.section_id,
        student_id: student.id
      };
    }
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      school_id: user.school_id,
      ...additionalClaims
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { old_password, new_password } = req.body;

  const user = await User.findByPk(req.user.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (old_password !== user.password) {
    throw new AppError("Current password is incorrect", 400);
  }

  user.password = new_password;
  await user.save();

  res.json({
    message: "Password updated successfully",
  });
});
