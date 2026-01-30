import TeacherTimetable from "./teacher-timetable.model.js";

export async function createTimetable(data) {
  return TeacherTimetable.create(data);
}

export async function getTeacherTimetable({ teacherId, day }) {
  return TeacherTimetable.findAll({
    where: {
      teacher_id: teacherId,
      day_of_week: day,
    },
    order: [["start_time", "ASC"]],
  });
}
