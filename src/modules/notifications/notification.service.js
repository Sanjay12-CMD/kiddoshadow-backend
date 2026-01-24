import Notification from "./notification.model.js";
import AppError from "../../shared/appError.js";
import { Op } from "sequelize";

export const createNotificationService = async ({
  school_id,
  sender_user_id,
  sender_role,
  title,
  message,
  target_role,
  class_id,
  section_id,
}) => {
  /* Role enforcement */
  if (sender_role === "teacher") {
    if (target_role === "teacher") {
      throw new AppError(
        "Teachers cannot notify other teachers",
        403
      );
    }
  }

  if (sender_role !== "admin" && sender_role !== "teacher") {
    throw new AppError("Not allowed to send notifications", 403);
  }

  const notification = await Notification.create({
    school_id,
    sender_user_id,
    sender_role,
    title,
    message,
    target_role,
    class_id,
    section_id,
  });

  return notification;
};


export const listNotificationsForUserService = async ({
  school_id,
  user_role,
  class_id,
  section_id,
}) => {
  const where = {
    school_id,
    is_active: true,
  };

  // role-based visibility
  if (user_role !== "admin") {
    where.target_role = {
      [Op.in]: ["all", user_role],
    };
  }

  // scope resolution:
  // - include school-wide (class_id = null)
  // - include class-specific
  // - include section-specific if provided
  where[Op.or] = [
    { class_id: null },
    { class_id },
  ];

  if (section_id) {
    where[Op.or].push({ section_id });
  }

  return Notification.findAll({
    where,
    order: [["created_at", "DESC"]],
  });
};
