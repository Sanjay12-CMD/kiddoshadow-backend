import TeacherClassSession from "./teacher-class-session.model.js";

export async function startSession({
  schoolId,
  teacherId,
  classId,
  sectionId,
  subjectId,
}) {
  return TeacherClassSession.create({
    school_id: schoolId,
    teacher_id: teacherId,
    class_id: classId,
    section_id: sectionId,
    subject_id: subjectId,
    started_at: new Date(),
  });
}

export async function endSession(sessionId) {
  const session = await TeacherClassSession.findByPk(sessionId);
  if (!session || session.ended_at) return null;

  session.ended_at = new Date();
  await session.save();

  return session;
}
