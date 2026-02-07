import { getPagination } from "../../shared/utils/pagination.js";
import { Op } from "sequelize";
import AppError from "../../shared/appError.js";

import Student from "../students/student.model.js";
import Teacher from "../teachers/teacher.model.js";
import Parent from "../parents/parent.model.js";
import User from "../users/user.model.js";
import TeacherAssignment from "../teacher-assignments/teacher-assignment.model.js";
import Class from "../classes/classes.model.js";
import Section from "../sections/section.model.js";

const resolveSchoolId = (school_id, user) => {
  const resolved = school_id ?? user?.school_id;
  if (!resolved) {
    throw new AppError("school_id is required", 400);
  }
  return resolved;
};

/* =========================
   TEACHER: STUDENT PENDING
========================= */
export const getPendingStudentApprovalsService = async ({
  school_id,
  user,
  class_id,
  query,
}) => {
  const scopedSchoolId = resolveSchoolId(school_id, user);
  const { limit, offset } = getPagination(query);
  const safeQuery = query || {};
  const { from_date, to_date } = safeQuery;

  const where = {
    school_id: scopedSchoolId,
    approval_status: "pending",
  };

  if (user?.role === "teacher") {
    const assignments = await TeacherAssignment.findAll({
      where: {
        school_id: scopedSchoolId,
        teacher_id: user.teacher_id,
        is_active: true,
      },
      attributes: ["class_id", "section_id"],
    });

    if (!assignments.length) {
      return { count: 0, rows: [] };
    }

    const allowedClassIds = [
      ...new Set(assignments.map((a) => a.class_id)),
    ];
    const allowedSectionIds = [
      ...new Set(assignments.map((a) => a.section_id)),
    ];

    if (class_id && !allowedClassIds.includes(Number(class_id))) {
      return { count: 0, rows: [] };
    }

    where.section_id = { [Op.in]: allowedSectionIds };
  }

  if (class_id) {
    where.class_id = Number(class_id);
  }

  if (from_date || to_date) {
    where.updated_at = {};
    if (from_date) where.updated_at[Op.gte] = new Date(from_date);
    if (to_date) where.updated_at[Op.lte] = new Date(to_date);
  }

  return Student.findAndCountAll({
    where,
    limit,
    offset,
    order: [["updated_at", "DESC"]],
    include: [
      {
        model: User,
        attributes: ["id", "name", "username", "email", "phone"],
      },
      { model: Class, attributes: ["id", "class_name"] },
      { model: Section, attributes: ["id", "name"] },
    ],
  });
};

/* =========================
   ADMIN: TEACHER PENDING
========================= */
export const getPendingTeacherApprovalsService = async ({
  school_id,
  user,
  query,
}) => {
  const scopedSchoolId = resolveSchoolId(school_id, user);
  const { limit, offset } = getPagination(query);
  const safeQuery = query || {};
  const { from_date, to_date } = safeQuery;

  const where = {
    school_id: scopedSchoolId,
    approval_status: "pending",
  };

  if (from_date || to_date) {
    where.updated_at = {};
    if (from_date) where.updated_at[Op.gte] = new Date(from_date);
    if (to_date) where.updated_at[Op.lte] = new Date(to_date);
  }

  return Teacher.findAndCountAll({
    where,
    limit,
    offset,
    order: [["updated_at", "DESC"]],
  });
};

/* =========================
   ADMIN: PARENT PENDING
========================= */
export const getPendingParentApprovalsService = async ({
  school_id,
  user,
  query,
}) => {
  const scopedSchoolId = resolveSchoolId(school_id, user);
  const { limit, offset } = getPagination(query);
  const safeQuery = query || {};
  const { from_date, to_date } = safeQuery;

  const where = {
    approval_status: "pending",
  };

  if (from_date || to_date) {
    where.created_at = {};
    if (from_date) where.created_at[Op.gte] = new Date(from_date);
    if (to_date) where.created_at[Op.lte] = new Date(to_date);
  }

  return Parent.findAndCountAll({
    where,
    include: [
      {
        model: User,
        required: true,
        where: { school_id: scopedSchoolId }, // FIXED: school scoped
        attributes: ["id", "name", "username", "email", "phone"],
      },
      {
        model: Student,
        include: [
          { model: User, attributes: ["id", "name", "username"] },
          { model: Class, attributes: ["id", "class_name"] },
          { model: Section, attributes: ["id", "name"] },
        ],
      },
    ],
    limit,
    offset,
    distinct: true,
    order: [["created_at", "DESC"]],
  });
};

/* =========================
   ACTION: APPROVE / REJECT
========================= */
export const processApprovalAction = async ({
  user,
  type,
  id,
  action,
  rejection_reason,
}) => {
  // 1. Validate Action
  const status = action === "approve" ? "approved" : "rejected";
  if (action === "reject" && !rejection_reason) {
    throw new AppError("Rejection reason is required", 400);
  }

  // 2. Determine Target Model
  let Model;
  if (type === "student") Model = Student;
  else if (type === "teacher") Model = Teacher;
  else if (type === "parent") Model = Parent;
  else throw new AppError("Invalid approval type", 400);

  // 3. Find Entity
  const include =
    type === "parent" ? [{ model: User, attributes: ["school_id"] }] : undefined;
  const entity = await Model.findByPk(id, include ? { include } : undefined);
  if (!entity) throw new AppError("Entity not found", 404);

  const entitySchoolId =
    type === "parent" ? (entity.user ?? entity.User)?.school_id : entity.school_id;

  // 4. Permission Check (CRITICAL)
  if (user.role === "teacher") {
    if (entitySchoolId !== user.school_id) {
      throw new AppError("Unauthorized", 403);
    }

    if (type === "student") {
      const hasAssignment = await TeacherAssignment.findOne({
        where: {
          school_id: user.school_id,
          teacher_id: user.teacher_id,
          section_id: entity.section_id,
          is_active: true,
        },
      });

      if (!hasAssignment) {
        throw new AppError("Forbidden role", 403);
      }
    }
  }

  if (user.role === "school_admin") {
    if (entitySchoolId !== user.school_id) {
      throw new AppError("Unauthorized", 403);
    }
  }

  // 5. Update Status
  await entity.update({
    approval_status: status,
    approved_by: user.id,
    approved_at: new Date(),
    rejection_reason: action === "reject" ? rejection_reason : null
  });

  return entity;
};
