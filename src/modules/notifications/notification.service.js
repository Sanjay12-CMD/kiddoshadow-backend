import Notification from "./notification.model.js";
import NotificationAck from "./notification-ack.model.js";
import AppError from "../../shared/appError.js";
import { Op } from "sequelize";
import User from "../users/user.model.js";
import School from "../schools/school.model.js";

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
  user_id,
  class_ids = [],
  section_ids = [],
}) => {
  const baseWhere = { school_id };

  if (user_role !== "school_admin") {
    const roleTargets = [user_role, "all"];
    const audienceFilter = { target_role: { [Op.in]: roleTargets } };

    const scopeConditions = [{ class_id: null }];
    if (class_ids.length) scopeConditions.push({ class_id: { [Op.in]: class_ids } });
    if (section_ids.length) scopeConditions.push({ section_id: { [Op.in]: section_ids } });

    const scopedAudienceWhere = {
      [Op.and]: [audienceFilter, { [Op.or]: scopeConditions }],
    };

    // Teachers should always see notifications they created, even if
    // class/section scope doesn't match due assignment data gaps.
    if (user_role === "teacher") {
      baseWhere[Op.or] = [scopedAudienceWhere, { sender_user_id: user_id }];
    } else {
      baseWhere[Op.and] = [audienceFilter, { [Op.or]: scopeConditions }];
    }
  }

  return Notification.findAndCountAll({
    where: baseWhere,
    include: [
      {
        model: User,
        attributes: ["id", "name", "avatar_url", "role"],
        required: false,
      },
      {
        model: School,
        attributes: ["id", "school_name", "logo_url"],
        required: false,
      },
      {
        model: NotificationAck,
        attributes: ["id", "user_id", "acknowledged_at"],
        required: false,
        where: { user_id },
        // separate:true runs a sub-query so the LEFT JOIN isn't
        // silently converted to INNER JOIN by the WHERE clause
        separate: true,
      },
    ],
    order: [["created_at", "DESC"]],
  });
};
