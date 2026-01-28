import { getPagination } from "../../shared/utils/pagination.js";
import { Op } from "sequelize";

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
