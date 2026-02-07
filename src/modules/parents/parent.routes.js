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
  listParents,
  listParentOptions,
  updateParentProfile,
  getMyProfile,
} from "./parent.controller.js";

const router = express.Router();

/* =========================
   ADMIN ROUTES
========================= */
router.post(
  "/parents",
  protect,
  allowRoles("school_admin"),
  validate(createParentAndLinkSchema),
  createParentAndLink
);

router.post(
  "/parents/link",
  protect,
  allowRoles("school_admin"),
  validate(linkExistingParentSchema),
  linkExistingParent
);

router.get(
  "/parents",
  protect,
  allowRoles("school_admin"),
  listParents
);

router.get(
  "/parents/options",
  protect,
  allowRoles("school_admin"),
  listParentOptions
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
