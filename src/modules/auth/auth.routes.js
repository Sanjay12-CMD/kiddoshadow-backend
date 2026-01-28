import express from "express";
import { login } from "./auth.controller.js";
import { loginSchema } from "./auth.schema.js";
import { validate } from "../../shared/middlewares/validate.js";

const router = express.Router();

router.post("/login", validate(loginSchema), login);

export default router;
