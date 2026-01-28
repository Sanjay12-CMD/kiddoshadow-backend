import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";

import {
  createSchool,
  listSchools,
  updateSchoolStatus,
  updateSchoolAdminStatus,
  resetSchoolAdminPassword,
} from "./school.controller.js";

import {
  createSchoolSchema,
  updateSchoolStatusSchema,
  updateSchoolAdminStatusSchema,
  resetSchoolAdminPasswordSchema,
} from "./school.schema.js";

const router = express.Router();

router.use(protect, allowRoles("super_admin"));

router.post("/", validate(createSchoolSchema), createSchool);


router.get("/", listSchools);
router.patch("/:id/status", validate(updateSchoolStatusSchema), updateSchoolStatus);
router.patch(
  "/:id/admin-status",
  validate(updateSchoolAdminStatusSchema),
  updateSchoolAdminStatus
);
router.patch(
  "/:id/admin-reset-password",
  validate(resetSchoolAdminPasswordSchema),
  resetSchoolAdminPassword
);

export default router;
