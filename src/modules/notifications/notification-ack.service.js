import Notification from "./notification.model.js";
import NotificationAck from "./notification-ack.model.js";
import AppError from "../../shared/appError.js";

export const acknowledgeNotificationService = async ({
  notification_id,
  user_id,
  user_role,
}) => {
 if (!["parent", "teacher", "student"].includes(user_role)) {
  throw new AppError("Not allowed to acknowledge", 403);
}

  const notification = await Notification.findByPk(notification_id);
  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  await NotificationAck.findOrCreate({
    where: {
      notification_id,
      user_id,
    },
    defaults: {
      user_role,
    },
  });

  return true;
};

/* VIEW ACKS (admin / sender teacher) */
export const listNotificationAcksService = async ({
  notification_id,
  requester,
}) => {
  const notification = await Notification.findByPk(notification_id);
  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  // Permission check
  if (
    requester.role !== "admin" &&
    notification.sender_user_id !== requester.id
  ) {
    throw new AppError("Not allowed to view acknowledgements", 403);
  }

  return NotificationAck.findAll({
    where: { notification_id },
    order: [["acknowledged_at", "ASC"]],
  });
};
