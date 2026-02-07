import asyncHandler from "../../shared/asyncHandler.js";
import {
  createNotificationService,
  listNotificationsForUserService,
} from "./notification.service.js";

/* ADMIN / TEACHER: CREATE */
export const createNotification = asyncHandler(async (req, res) => {
  const notification = await createNotificationService({
    school_id: req.user.school_id,
    sender_user_id: req.user.id,
    sender_role: req.user.role,
    ...req.body,
  });

  res.status(201).json({
    success: true,
    data: notification,
  });
});

/* ALL USERS: LIST */
export const listNotifications = asyncHandler(async (req, res) => {
  let classIds = [];
  let sectionIds = [];

  if (req.user.role === "student") {
    if (req.user.class_id) classIds = [req.user.class_id];
    if (req.user.section_id) sectionIds = [req.user.section_id];
  }

  if (req.user.role === "parent") {
    const Parent = (await import("../parents/parent.model.js")).default;
    const Student = (await import("../students/student.model.js")).default;

    const links = await Parent.findAll({
      where: { user_id: req.user.id, approval_status: "approved" },
      include: [{ model: Student, attributes: ["class_id", "section_id"] }],
    });

    classIds = links
      .map((l) => (l.student ?? l.Student)?.class_id)
      .filter((v) => v !== undefined && v !== null);
    sectionIds = links
      .map((l) => (l.student ?? l.Student)?.section_id)
      .filter((v) => v !== undefined && v !== null);
  }

  if (req.user.role === "teacher") {
    const TeacherAssignment = (await import("../teacher-assignments/teacher-assignment.model.js")).default;
    const assignments = await TeacherAssignment.findAll({
      where: { teacher_id: req.user.id },
      attributes: ["class_id", "section_id"],
    });
    classIds = [
      ...classIds,
      ...assignments.map((a) => a.class_id).filter(Boolean),
    ];
    sectionIds = [
      ...sectionIds,
      ...assignments.map((a) => a.section_id).filter(Boolean),
    ];
  }

  const result = await listNotificationsForUserService({
    school_id: req.user.school_id,
    user_role: req.user.role,
    user_id: req.user.id,
    class_ids: classIds,
    section_ids: sectionIds,
  });

  res.json({
    success: true,
    total: result.count,
    items: result.rows.map((row) => {
      const plain = row.toJSON();
      const ack = plain.notification_acks?.[0];
      return {
        ...plain,
        is_acknowledged: Boolean(ack),
        acknowledged_at: ack?.acknowledged_at || null,
      };
    }),
  });
});
