import Notification from "./notifications.model.js";
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
  const orConditions = [{ class_id: null }];

  if (class_id) {
    orConditions.push({ class_id });
  }

  where[Op.or] = orConditions;

  if (section_id) {
    // If we have an OR condition for class, we need to be careful. 
    // Usually section notifications invoke specific section. 
    // Assuming structure: (class_id IS NULL) OR (class_id = X) OR (section_id = Y)
    // Or is it (class_id IS NULL) OR (class_id = X AND (section_id IS NULL OR section_id = Y))?
    // Based on original code: where[Op.or].push({ section_id }) implies top-level OR.
    where[Op.or].push({ section_id });
  }

  return Notification.findAll({
    where,
    order: [["created_at", "DESC"]],
  });
};
