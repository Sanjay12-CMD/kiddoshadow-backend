import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { validate } from "../../shared/middlewares/validate.js";
import { allowRoles } from "../../shared/middlewares/role.js";

import {
  createNotificationSchema,
} from "./notification.schema.js";
import {
  createNotification,
  listNotifications,
} from "./notification.controller.js";
import {
  acknowledgeNotification,
  listNotificationAcks,
} from "./notification-ack.controller.js";

const router = express.Router();

router.use(protect);

/* admin & teacher */
router.post(
  "/",
  allowRoles("school_admin", "teacher"),
  validate(createNotificationSchema),
  createNotification
);

/* all logged-in users */
router.get("/", listNotifications);

router.post(
  "/:id/acknowledge",
  protect,
  acknowledgeNotification
);

router.get(
  "/:id/acknowledgements",
  protect,
  listNotificationAcks
);

export default router;
