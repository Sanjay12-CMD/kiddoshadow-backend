import Homework from "./homework.model.js";
import Section from "../sections/section.model.js";
import TeacherAssignment from "../teacher-assignments/teacher-assignment.model.js";
import Subject from "../subjects/subject.model.js";
import AppError from "../../shared/appError.js";
import { triggerHomeworkNotification } from "../notifications/notification-trigger.service.js";
import { getPagination } from "../../shared/utils/pagination.js";

export const createHomeworkService = async ({
  user,
  school_id,
  class_id,
  section_id,
  teacher_assignment_id,
  homework_date,
  description,
}) => {
  // 1️⃣ Validate section
  const section = await Section.findOne({
    where: { id: section_id, class_id, school_id, is_active: true },
  });

  if (!section) {
    throw new AppError("SECTION_NOT_FOUND", 404);
  }

  // 2️⃣ Validate teacher assignment
  const assignment = await TeacherAssignment.findOne({
    where: {
      id: teacher_assignment_id,
      school_id,
      section_id,
      is_active: true,
    },
    include: [{ model: Subject }],
  });

  if (!assignment) {
    throw new AppError("INVALID_TEACHER_ASSIGNMENT", 400);
  }

  // 3️⃣ Permission check (teacher must own assignment)
  if (user.role === "teacher" && assignment.teacher_id !== user.teacher_id) {
    throw new AppError("FORBIDDEN", 403);
  }

  // 4️⃣ Create homework
  const homework = await Homework.create({
    school_id,
    class_id,
    section_id,
    teacher_assignment_id: assignment.id,
    subject_id: assignment.subject_id, // derived
    homework_date,
    description,
    created_by: user.id,
  });

  // 5️⃣ Notify
  await triggerHomeworkNotification({
    school_id,
    teacher_user_id: user.id,
    class_id,
    section_id,
    subject_name: assignment.subject?.name,
  });

  return homework;
};
export const listHomeworkService = async ({
  school_id,
  class_id,
  section_id,
  date,
  query,
}) => {
  const { limit, offset } = getPagination(query);

  const where = { school_id };
  if (class_id) where.class_id = class_id;
  if (section_id) where.section_id = section_id;
  if (date) where.homework_date = date;

  return Homework.findAndCountAll({
    where,
    include: [{ model: Subject }],
    order: [["homework_date", "DESC"]],
    limit,
    offset,
  });
};
