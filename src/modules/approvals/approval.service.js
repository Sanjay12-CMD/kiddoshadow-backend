import { getPagination } from "../../shared/utils/pagination.js";
import { Op } from "sequelize";
import AppError from "../../shared/appError.js";

import Student from "../students/student.model.js";
import Teacher from "../teachers/teacher.model.js";
import Parent from "../parents/parent.model.js";
import User from "../users/user.model.js";

/* =========================
   TEACHER: STUDENT PENDING
========================= */
export const getPendingStudentApprovalsService = async ({
  school_id,
  class_id,
  query,
}) => {
  const { limit, offset } = getPagination(query);
  const safeQuery = query || {};
  const { from_date, to_date } = safeQuery;

  const where = {
    school_id,
    approval_status: "pending",
  };

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
  });
};

/* =========================
   ADMIN: TEACHER PENDING
========================= */
export const getPendingTeacherApprovalsService = async ({
  school_id,
  query,
}) => {
  const { limit, offset } = getPagination(query);
  const safeQuery = query || {};
  const { from_date, to_date } = safeQuery;

  const where = {
    school_id,
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
  query,
}) => {
  const { limit, offset } = getPagination(query);
  const safeQuery = query || {};
  const { from_date, to_date } = safeQuery;

  const where = {
    school_id,
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
        where: { school_id }, // ✅ FIXED: school scoped
        attributes: [],
      },
    ],
    limit,
    offset,
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
  const entity = await Model.findByPk(id);
  if (!entity) throw new AppError("Entity not found", 404);

  // 4. Permission Check (CRITICAL)
  if (user.role === "teacher") {
    if (entity.school_id !== user.school_id) {
      throw new AppError("Unauthorized", 403);
    }
  }

  if (user.role === "school_admin") {
    if (entity.school_id !== user.school_id) {
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
