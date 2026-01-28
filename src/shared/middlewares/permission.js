import AppError from "../appError.js";
import Class from "../../modules/classes/classes.model.js";
import Section from "../../modules/sections/section.model.js";

/**
 * Admin OR class teacher of the given class
 */
export const allowAdminOrClassTeacher = async (req, res, next) => {
  if (req.user.role === "admin") return next();

  const classId =
    req.body.class_id ||
    req.query.class_id ||
    req.params.class_id;

  if (!classId) {
    throw new AppError("class_id is required for permission check", 400);
  }

  const cls = await Class.findOne({
    where: {
      id: classId,
      class_teacher_id: req.user.id,
    },
  });

  if (!cls) {
    throw new AppError(
      "You are not allowed to manage this class",
      403
    );
  }

  next();
};

/**
 * Admin OR class teacher of section's class
 */
export const allowAdminOrSectionClassTeacher = async (
  req,
  res,
  next
) => {
  if (req.user.role === "admin") return next();

  const sectionId =
    req.body.section_id ||
    req.query.section_id ||
    req.params.section_id;

  if (!sectionId) {
    throw new AppError(
      "section_id is required for permission check",
      400
    );
  }

  const section = await Section.findOne({
    where: { id: sectionId },
    include: [
      {
        model: Class,
        where: { class_teacher_id: req.user.id },
      },
    ],
  });

  if (!section) {
    throw new AppError(
      "You are not allowed to manage this section",
      403
    );
  }

  next();
};
