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

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      school_id: user.school_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
});
