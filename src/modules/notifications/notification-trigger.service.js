import Notification from "./notification.model.js";

/**
 * Generic trigger helper
 */
const createNotification = async ({
  school_id,
  sender_user_id,
  sender_role,
  title,
  message,
  target_role,
  class_id = null,
  section_id = null,
}) => {
  return Notification.create({
    school_id,
    sender_user_id,
    sender_role,
    title,
    message,
    target_role,
    class_id,
    section_id,
  });
};

/* ===============================
   HOMEWORK CREATED
================================ */
export const triggerHomeworkNotification = async ({
  school_id,
  teacher_user_id,
  class_id,
  section_id,
  subject_name,
}) => {
  return createNotification({
    school_id,
    sender_user_id: teacher_user_id,
    sender_role: "teacher",
    title: "New Homework Assigned",
    message: `New homework has been assigned for ${subject_name}. Please check.`,
    target_role: "all", // parents + students
    class_id,
    section_id,
  });
};

/* ===============================
   EXAM CREATED
================================ */
export const triggerExamNotification = async ({
  school_id,
  sender_user_id,
  sender_role,
  exam_name,
  class_id,
  section_id,
  start_date,
  end_date,
}) => {
  const formattedStart = start_date
    ? new Date(start_date).toLocaleDateString("en-GB")
    : null;
  const formattedEnd = end_date
    ? new Date(end_date).toLocaleDateString("en-GB")
    : null;

  let message = `A new exam "${exam_name}" has been scheduled.`;
  if (formattedStart && formattedEnd) {
    message += ` Dates: ${formattedStart} to ${formattedEnd}.`;
  } else if (formattedStart) {
    message += ` Date: ${formattedStart}.`;
  }

  return createNotification({
    school_id,
    sender_user_id,
    sender_role,
    title: "New Exam Scheduled",
    message,
    target_role: "all", // students + parents
    class_id,
    section_id,
  });
};

/* ===============================
   REPORT CARD PUBLISHED
================================ */
export const triggerReportCardNotification = async ({
  school_id,
  teacher_user_id,
  student_name,
  exam_name,
  class_id,
  section_id,
}) => {
  return createNotification({
    school_id,
    sender_user_id: teacher_user_id,
    sender_role: "teacher",
    title: "Report Card Published",
    message: `Report card for ${student_name} (${exam_name}) has been published.`,
    target_role: "all", // students + parents
    class_id,
    section_id,
  });
};
