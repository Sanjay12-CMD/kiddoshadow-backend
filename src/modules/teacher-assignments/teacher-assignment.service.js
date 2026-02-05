import TeacherAssignment from "./teacher-assignment.model.js";
import AppError from "../../shared/appError.js";
import { getPagination } from "../../shared/utils/pagination.js";
import { Op } from "sequelize";


/* CREATE */
export async function assignTeacher({
  schoolId,
  teacherId,
  classId,
  sectionId,
  subjectId,
  isClassTeacher = false,
}) {
  // Check for existing assignment (same teacher + section + subject in same school)
  const exists = await TeacherAssignment.findOne({
    where: {
      school_id: schoolId,
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

  // If trying to set as class teacher, check if section already has a class teacher
  if (isClassTeacher) {
    const existingClassTeacher = await TeacherAssignment.findOne({
      where: {
        school_id: schoolId,
        section_id: sectionId,
        is_class_teacher: true,
        is_active: true,
      },
    });

    if (existingClassTeacher) {
      throw new AppError(
        "This section already has a class teacher assigned",
        409
      );
    }
  }

  return TeacherAssignment.create({
    school_id: schoolId,
    teacher_id: teacherId,
    class_id: classId,
    section_id: sectionId,
    subject_id: subjectId,
    is_class_teacher: isClassTeacher,
  });
}

/* LIST ALL (with pagination) */
export async function listAssignments({ schoolId, query }) {
  const { limit, offset } = getPagination(query);

  return TeacherAssignment.findAndCountAll({
    where: {
      school_id: schoolId,
      is_active: true,
    },
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });
}

/* LIST BY TEACHER */
export async function getTeacherAssignments({ schoolId, teacherId }) {
  return TeacherAssignment.findAll({
    where: {
      school_id: schoolId,
      teacher_id: teacherId,
      is_active: true,
    },
    order: [["created_at", "DESC"]],
  });
}

/* LIST BY SECTION */
export async function getSectionAssignments({ schoolId, sectionId }) {
  return TeacherAssignment.findAll({
    where: {
      school_id: schoolId,
      section_id: sectionId,
      is_active: true,
    },
    order: [["created_at", "DESC"]],
  });
}

/* UPDATE */
export async function updateAssignment({ schoolId, assignmentId, updates }) {
  const assignment = await TeacherAssignment.findOne({
    where: {
      id: assignmentId,
      school_id: schoolId,
    },
  });

  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  // If trying to set as class teacher, check if section already has a class teacher
  if (updates.is_class_teacher === true) {
    const existingClassTeacher = await TeacherAssignment.findOne({
      where: {
        school_id: schoolId,
        section_id: assignment.section_id,
        is_class_teacher: true,
        is_active: true,
        id: { [Op.ne]: assignmentId }, // Exclude current assignment
      },
    });

    if (existingClassTeacher) {
      throw new AppError(
        "This section already has a class teacher assigned",
        409
      );
    }
  }

  await assignment.update(updates);
  return assignment;
}

/* DELETE (soft delete by setting is_active to false) */
export async function deleteAssignment({ schoolId, assignmentId }) {
  const assignment = await TeacherAssignment.findOne({
    where: {
      id: assignmentId,
      school_id: schoolId,
    },
  });

  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  await assignment.update({ is_active: false });
  return { message: "Assignment deleted successfully" };
}

