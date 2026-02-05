import express from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";

import {
  createParentAndLinkSchema,
  linkExistingParentSchema,
  updateParentProfileSchema,
} from "./parent.schema.js";

import {
  createParentAndLink,
  linkExistingParent,
  updateParentProfile,
  getMyProfile,
} from "./parent.controller.js";

const router = express.Router();

/* =========================
   ADMIN ROUTES
========================= */
router.post(
  "/admin/parents",
  protect,
  allowRoles("admin"),
  validate(createParentAndLinkSchema),
  createParentAndLink
);

router.post(
  "/admin/parents/link",
  protect,
  allowRoles("admin"),
  validate(linkExistingParentSchema),
  linkExistingParent
);

/* =========================
   PARENT ROUTES
========================= */
router.patch(
  "/parents/profile",
  protect,
  allowRoles("parent"),
  validate(updateParentProfileSchema),
  updateParentProfile
);

router.get(
  "/parents/profile",
  protect,
  allowRoles("parent"),
  getMyProfile
);

export default router;
