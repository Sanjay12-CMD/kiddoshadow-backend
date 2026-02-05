import express from "express";
import {
    createSubject,
    getAllSubjects,
    updateSubject,
    deleteSubject,
} from "./subject.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
    createSubjectSchema,
    updateSubjectSchema,
} from "./subject.schema.js";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";

const router = express.Router();

router.use(protect);
router.use(allowRoles("school_admin")); // Only School Admins can manage subjects

router
    .route("/")
    .post(validate(createSubjectSchema), createSubject)
    .get(getAllSubjects);

router
    .route("/:id")
    .patch(validate(updateSubjectSchema), updateSubject)
    .delete(deleteSubject);

export default router;
