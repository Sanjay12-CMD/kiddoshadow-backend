import express from "express";
import auth from "../../shared/middlewares/auth.js";
import validate from "../../shared/middlewares/validate.js";
import {
  createClassSchema,
  updateClassSchema,
} from "./classes.schema.js";
import {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
} from "./classes.controller.js";

const router = express.Router();

router.use(auth);

router.post("/", validate(createClassSchema), createClass);
router.get("/", getClasses);
router.get("/:id", getClassById);
router.patch("/:id", validate(updateClassSchema), updateClass);
router.delete("/:id", deleteClass);

export default router;
