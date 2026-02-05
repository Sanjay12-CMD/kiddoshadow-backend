import express from "express";
import { login, changePassword } from "./auth.controller.js";
import { loginSchema, changePasswordSchema } from "./auth.schema.js";
import { validate } from "../../shared/middlewares/validate.js";
import { protect } from "../../shared/middlewares/auth.js";

const router = express.Router();

router.post("/login", validate(loginSchema), login);
router.post(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  changePassword
);

export default router;
