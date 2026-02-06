import db from "../../config/db.js";
import { Op } from "sequelize";

import Timetable from "./timetable.model.js";
import Section from "../sections/section.model.js";
import Class from "../classes/classes.model.js";
import TeacherAssignment from "../teacher-assignments/teacher-assignment.model.js";
import Subject from "../subjects/subject.model.js";
import User from "../users/user.model.js";
import AppError from "../../shared/appError.js";

/* =====================================================
   CREATE / UPDATE SECTION TIMETABLE
   (School Admin or Class Teacher)
===================================================== */
export const saveTimetableService = async ({
  user,
  school_id,
  class_id,
  section_id,
  day_of_week,
  entries,
}) => {
  return db.transaction(async (t) => {
    /**
     * 1️⃣ Validate section
     */
    const section = await Section.findOne({
      where: { id: section_id, class_id, school_id, is_active: true },
      transaction: t,
    });

    if (!section) {
      throw new AppError("SECTION_NOT_FOUND", 404);
    }

    /**
     * 2️⃣ Permission check
     * - School admin: always allowed
     * - Teacher: must be class teacher of this section
     */
    if (user.role === "teacher") {
      const isClassTeacher = await TeacherAssignment.findOne({
        where: {
          section_id,
          school_id,
          teacher_id: user.teacher_id,
          is_class_teacher: true,
          is_active: true,
        },
        transaction: t,
      });

      if (!isClassTeacher) {
        throw new AppError("FORBIDDEN", 403);
      }
    }

    /**
     * 3️⃣ Remove existing timetable for that day
     */
    await Timetable.destroy({
      where: { school_id, class_id, section_id, day_of_week },
      transaction: t,
    });

    /**
     * 4️⃣ Insert new timetable entries
     */
    for (const e of entries) {
      if (!e.is_break && !e.teacher_assignment_id) {
        throw new AppError("ASSIGNMENT_REQUIRED", 400);
      }

      let assignment = null;

      if (!e.is_break) {
        assignment = await TeacherAssignment.findOne({
          where: {
            id: e.teacher_assignment_id,
            school_id,
            class_id,
            section_id,
            is_active: true,
          },
          transaction: t,
        });

        if (!assignment) {
          throw new AppError("INVALID_TEACHER_ASSIGNMENT", 400);
        }
      }

      await Timetable.create(
        {
          school_id,
          class_id,
          section_id,
          day_of_week,
          start_time: e.start_time,
          end_time: e.end_time,
          teacher_assignment_id: e.is_break ? null : assignment.id,
          is_break: e.is_break,
          title: e.is_break ? e.title : null,
        },
        { transaction: t }
      );
    }

    return { success: true };
  });
};

/* =====================================================
   STUDENT VIEW: SECTION TIMETABLE
   (Mon–Sat, periods with subject & time)
===================================================== */
export const getSectionTimetableService = async ({
  school_id,
  class_id,
  section_id,
}) => {
  const rows = await Timetable.findAll({
    where: { school_id, class_id, section_id },
    include: [
      {
        model: TeacherAssignment,
        required: false,
        include: [
          {
            model: Subject,
            attributes: ["id", "name"],
          },
        ],
      },
    ],
    order: [
      ["day_of_week", "ASC"],
      ["start_time", "ASC"],
    ],
  });

  /**
   * Group by day_of_week (Monday → Saturday)
   */
  const grouped = {};

  for (const row of rows) {
    const day = row.day_of_week;
    if (!grouped[day]) grouped[day] = [];

    grouped[day].push({
      id: row.id,
      start_time: row.start_time,
      end_time: row.end_time,
      is_break: row.is_break,
      title: row.is_break ? row.title : null,
      subject: row.is_break
        ? null
        : row.teacher_assignment.subject,
    });
  }

  return grouped;
};

/* =====================================================
   TEACHER VIEW: OWN TIMETABLE
   (Which class, section, subject, time)
===================================================== */
export const getTeacherTimetableService = async ({
  school_id,
  teacher_id,
}) => {
  const rows = await Timetable.findAll({
    include: [
      {
        model: TeacherAssignment,
        where: {
          teacher_id,
          school_id,
          is_active: true,
        },
        include: [
          {
            model: Subject,
            attributes: ["id", "name"],
          },
        ],
      },
      {
        model: Class,
        attributes: ["id", "class_name"],
      },
      {
        model: Section,
        attributes: ["id", "name"],
      },
    ],
    order: [
      ["day_of_week", "ASC"],
      ["start_time", "ASC"],
    ],
  });

  /**
   * Group by day_of_week
   */
  const grouped = {};

  for (const row of rows) {
    const day = row.day_of_week;
    if (!grouped[day]) grouped[day] = [];

    grouped[day].push({
      id: row.id,
      start_time: row.start_time,
      end_time: row.end_time,
      class: row.class,
      section: row.section,
      subject: row.teacher_assignment.subject,
    });
  }

  return grouped;
};
