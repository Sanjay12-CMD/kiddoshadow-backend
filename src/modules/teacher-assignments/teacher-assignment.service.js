import TeacherAssignment from "./teacher-assignment.model.js";

export async function assignTeacher({
  schoolId,
  teacherId,
  classId,
  sectionId,
  subjectId,
}) {
  return TeacherAssignment.create({
    school_id: schoolId,
    teacher_id: teacherId,
    class_id: classId,
    section_id: sectionId,
    subject_id: subjectId,
  });
}

export async function getTeacherAssignments({ schoolId, teacherId }) {
  return TeacherAssignment.findAll({
    where: {
      school_id: schoolId,
      teacher_id: teacherId,
      is_active: true,
    },
  });
}
