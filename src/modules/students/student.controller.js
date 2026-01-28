import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import {
  autoCreateStudentsService,
  listStudentsService,
  moveStudentService,
  updateStudentStatusService,
} from "./student.service.js";
import Student from "./student.model.js";
import User from "../users/user.model.js";

/* ADMIN: AUTO CREATE */
export const autoCreateStudents = asyncHandler(async (req, res) => {
  const result = await autoCreateStudentsService({
    school_id: req.user.school_id,
    class_id: req.body.class_id,
    sections: req.body.sections,
  });

  res.status(201).json({ created: result.length, students: result });
});

/* ADMIN: LIST */
export const listStudents = asyncHandler(async (req, res) => {
  const result = await listStudentsService({
    school_id: req.user.school_id,
    query: req.query,
  });

  res.json({
    total: result.count,
    items: result.rows,
  });
});

/* ADMIN: MOVE */
export const moveStudent = asyncHandler(async (req, res) => {
  const student = await moveStudentService({
    student_id: req.params.id,
    section_id: req.body.section_id,
    school_id: req.user.school_id,
  });
  res.json({ message: "Student moved", student });
});

/* ADMIN: STATUS */
export const updateStudentStatus = asyncHandler(async (req, res) => {
  const student = await updateStudentStatusService({
    student_id: req.params.id,
    is_active: req.body.is_active,
    school_id: req.user.school_id,
  });
  res.json({ message: "Status updated", student });
});

/* STUDENT: COMPLETE PROFILE */
export const completeStudentProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const student = await Student.findOne({
    where: { user_id: req.user.id },
  });
  if (!student) throw new AppError("Student profile not found", 404);

  await User.update(
    { name, phone, first_login: false },
    { where: { id: req.user.id } }
  );

  res.json({ message: "Profile completed" });
});

/* STUDENT: MY PROFILE */
export const getMyProfile = asyncHandler(async (req, res) => {
  const student = await Student.findOne({
    where: { user_id: req.user.id },
    include: ["class", "section"],
  });
  if (!student) throw new AppError("Student profile not found", 404);

  res.json(student);
});


//assign students to section

export const assignStudentsToSection = asyncHandler(async (req, res) => {
  const result = await assignStudentsToSectionService({
    school_id: req.user.school_id,
    ...req.body,
  });

  if (result?.error === "CLASS_NOT_FOUND") {
    throw new AppError("Target class not found", 404);
  }

  if (result?.error === "SECTION_NOT_FOUND") {
    throw new AppError("Target section not found or inactive", 404);
  }

  res.json({
    success: true,
    message: "Students assigned successfully",
  });
});