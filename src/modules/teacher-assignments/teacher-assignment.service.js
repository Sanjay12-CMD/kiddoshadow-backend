import TeacherAssignment from "./teacher-assignment.model.js";
import AppError from "../../shared/appError.js";

export async function assignTeacher({
  schoolId,
  teacherId,
  classId,
  sectionId,
  subjectId,
}) {
  // Check for existing assignment
  const exists = await TeacherAssignment.findOne({
    where: {
      teacher_id: teacherId,
      section_id: sectionId,
      subject_id: subjectId,
      is_active: true,
    },
  });

  if (exists) {
    throw new AppError(
      "Teacher already assigned to this subject in this section",
      409
    );
  }

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
