import TeacherClassSession from "./teacher-class-session.model.js";
import TeacherAssignment from "../teacher-assignments/teacher-assignment.model.js";
import Timetable from "../timetables/timetable.model.js";
import AppError from "../../shared/appError.js";


export async function startSession({
  user,
  school_id,
  teacher_assignment_id,
  timetable_id,
}) {
  // 1️⃣ Validate assignment
  const assignment = await TeacherAssignment.findOne({
    where: {
      id: teacher_assignment_id,
      school_id,
      is_active: true,
    },
  });

  if (!assignment) {
    throw new AppError("INVALID_ASSIGNMENT", 400);
  }

  // 2️⃣ Permission check
  if (user.role === "teacher" && assignment.teacher_id !== user.teacher_id) {
    throw new AppError("FORBIDDEN", 403);
  }

  // 3️⃣ Validate timetable slot
  const timetable = await Timetable.findOne({
    where: {
      id: timetable_id,
      teacher_assignment_id,
    },
  });

  if (!timetable) {
    throw new AppError("INVALID_TIMETABLE_SLOT", 400);
  }

  // 4️⃣ Prevent parallel session
  const existing = await TeacherClassSession.findOne({
    where: {
      teacher_assignment_id,
      ended_at: null,
    },
  });

  if (existing) {
    throw new AppError("SESSION_ALREADY_RUNNING", 409);
  }

  // 5️⃣ Create session
  return TeacherClassSession.create({
    school_id,
    teacher_assignment_id,
    timetable_id,
    started_at: new Date(),
  });
}
export async function endSession({ session_id, user }) {
  const session = await TeacherClassSession.findByPk(session_id);

  if (!session) {
    throw new AppError("SESSION_NOT_FOUND", 404);
  }

  if (session.ended_at) {
    throw new AppError("SESSION_ALREADY_ENDED", 409);
  }

  // optional: permission check
  if (user.role === "teacher" && session.teacher_id !== user.teacher_id) {
    throw new AppError("FORBIDDEN", 403);
  }

  session.ended_at = new Date();
  await session.save();

  return session;
}
