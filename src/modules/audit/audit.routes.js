import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { listAuditLogsSchema } from "./audit.schema.js";
import { listAuditLogs } from "./audit.controller.js";

const router = express.Router();

router.get(
    "/admin/audit-logs",
    protect,
    allowRoles("admin"),
    validate(listAuditLogsSchema),
    listAuditLogs
);

export default router;
