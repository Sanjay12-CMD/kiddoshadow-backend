import TeacherTimetable from "./teacher-timetable.model.js";
import Class from "../classes/classes.model.js";
import Section from "../sections/section.model.js";
import Subject from "../subjects/subject.model.js";

export async function getTeacherTimetable({ teacherId }) {
  const rows = await TeacherTimetable.findAll({
    where: {
      teacher_id: teacherId,
    },
    include: [
      {
        model: Class,
        attributes: ["id", "class_name"],
      },
      {
        model: Section,
        attributes: ["id", "name"],
      },
      {
        model: Subject,
        attributes: ["id", "name"],
      },
    ],
    order: [
      ["day_of_week", "ASC"],
      ["start_time", "ASC"],
    ],
  });

  // group by day_of_week
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
      subject: row.subject,
    });
  }

  return grouped;
}

export async function createTimetable(data) {
  return TeacherTimetable.create(data);
}
