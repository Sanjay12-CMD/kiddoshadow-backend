import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import {
  createTeacherService,
  listTeachersService,
  updateTeacherStatusService,
} from "./teacher.service.js";
import Teacher from "./teacher.model.js";
import User from "../users/user.model.js";

/* ADMIN: CREATE */
export const createTeacher = asyncHandler(async (req, res) => {
  const result = await createTeacherService({
    school_id: req.user.school_id,
    username: req.body.username,
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

  await User.update(
    { name, phone, first_login: false },
    { where: { id: req.user.id } }
  );

  await teacher.update({
    gender,
    designation,
    qualification,
    experience,
  });

  res.json({ message: "Profile completed" });
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
