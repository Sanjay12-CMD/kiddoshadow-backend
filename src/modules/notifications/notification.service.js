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
  if (sender_role === "teacher" && target_role === "teacher") {
    throw new AppError("Teachers cannot notify other teachers", 403);
  }

  if (sender_role !== "school_admin" && sender_role !== "teacher") {
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
  class_ids = [],
  section_ids = [],
}) => {
  const roleTargets =
    user_role === "teacher" ? [user_role] : [user_role, "all"];

  const where = {
    school_id,
    target_role: { [Op.in]: roleTargets },
  };
  const orConditions = [];

  // Notifications with no class/section targeting (broadcast to all in role)
  orConditions.push({ class_id: null });

  if (class_ids.length) {
    orConditions.push({ class_id: { [Op.in]: class_ids } });
  }

  where[Op.or] = orConditions;

  if (section_ids.length) {
    where[Op.or].push({ section_id: { [Op.in]: section_ids } });
  }

  return Notification.findAndCountAll({
    where,
    order: [["created_at", "DESC"]],
  });
};
