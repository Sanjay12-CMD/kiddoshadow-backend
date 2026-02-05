import Homework from "./homework.model.js";
import Section from "../sections/section.model.js";
import Subject from "../subjects/subject.model.js";
import { triggerHomeworkNotification } from "../notifications/notification-trigger.service.js";


export const createHomeworkService = async ({
  school_id,
  class_id,
  section_id,
  subject_id,
  homework_date,
  description,
  created_by,
}) => {
  // validate section belongs to class
  const section = await Section.findOne({
    where: { id: section_id, class_id, school_id, is_active: true },
  });

  if (!section) {
    return { error: "SECTION_NOT_FOUND" };
  }

  // validate subject exists (optional but good)
  const subject = await Subject.findOne({
    where: { id: subject_id, school_id },
  });

  if (!subject) {
    return { error: "SUBJECT_NOT_FOUND" };
  }

  const homework = await Homework.create({
    school_id,
    class_id,
    section_id,
    subject_id,
    homework_date,
    description,
    created_by,
  });

  await triggerHomeworkNotification({
    school_id,
    teacher_user_id: created_by,
    class_id,
    section_id,
    subject_name: subject?.name || "subject",
  });

  return { homework };
};

export const listHomeworkService = async ({
  school_id,
  class_id,
  section_id,
  date,
}) => {
  const where = { school_id };

  if (class_id) where.class_id = class_id;
  if (section_id) where.section_id = section_id;
  if (date) where.homework_date = date;

  return Homework.findAll({
    where,
    order: [["homework_date", "DESC"]],
  });
};
