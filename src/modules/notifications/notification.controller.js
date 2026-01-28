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
  const notifications = await listNotificationsForUserService({
    school_id: req.user.school_id,
    user_role: req.user.role,
    class_id: req.user.class_id,
    section_id: req.user.section_id,
  });

  res.json({
    success: true,
    data: notifications,
  });
});
