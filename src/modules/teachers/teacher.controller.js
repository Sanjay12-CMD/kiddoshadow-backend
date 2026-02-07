import asyncHandler from "../../shared/asyncHandler.js";
import jwt from "jsonwebtoken";
import AppError from "../../shared/appError.js";
import {
  createTeacherService,
  listTeachersService,
  updateTeacherStatusService,
  listTeacherOptionsService,
} from "./teacher.service.js";
import Teacher from "./teacher.model.js";
import User from "../users/user.model.js";

/* ADMIN: CREATE */
export const createTeacher = asyncHandler(async (req, res) => {
  const result = await createTeacherService({
    school_id: req.user.school_id,
    username: req.body.username,
    password: req.body.password,
  });

  res.status(201).json(result);
});

/* ADMIN: LIST */
export const listTeachers = asyncHandler(async (req, res) => {
  const result = await listTeachersService({
    school_id: req.user.school_id,
    query: req.query,
  });

  res.json({
    total: result.count,
    items: result.rows,
  });
});

/* ADMIN: OPTIONS */
export const listTeacherOptions = asyncHandler(async (req, res) => {
  const result = await listTeacherOptionsService({
    school_id: req.user.school_id,
  });

  res.json({
    total: result.length,
    items: result,
  });
});

/* ADMIN: STATUS */
export const updateTeacherStatus = asyncHandler(async (req, res) => {
  const teacher = await updateTeacherStatusService({
    teacher_id: req.params.id,
    is_active: req.body.is_active,
    school_id: req.user.school_id,
  });

  res.json({ message: "Status updated", teacher });
});

/* TEACHER: COMPLETE PROFILE */
export const completeTeacherProfile = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    email,
    gender,
    designation,
    qualification,
    experience,
  } = req.body;

  const teacher = await Teacher.findOne({
    where: { user_id: req.user.id },
  });

  if (!teacher) {
    throw new AppError("Teacher profile not found", 404);
  }

  // Update User details
  const user = await User.update(
    { name, phone, email, first_login: false },
    { where: { id: req.user.id }, returning: true, plain: true }
  ).then(() => User.findByPk(req.user.id)); // Fetch updated user for token

  // Update Teacher details
  await teacher.update({
    gender,
    designation,
    qualification,
    experience,
  });

  /* Create new token */
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      school_id: user.school_id,
      iat: Date.now(),
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  res.json({ message: "Profile completed", token, user });
});

/* TEACHER: MY PROFILE */
export const getMyProfile = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({
    where: { user_id: req.user.id },
    include: ["user"],
  });

  if (!teacher) {
    throw new AppError("Teacher profile not found", 404);
  }

  res.json(teacher);
});
