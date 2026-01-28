import { Op } from "sequelize";
import AuditLog from "./audit-log.model.js";
import User from "../users/user.model.js";
import { getPagination } from "../../shared/utils/pagination.js";

export const listAuditLogsService = async ({ school_id, query }) => {
  const { limit, offset } = getPagination(query);
  const safeQuery = query || {};
  const { entity_type, entity_id, from_date, to_date } = safeQuery;

  const where = {};

  if (entity_type) {
    where.entity_type = entity_type;
  }

  if (entity_id) {
    where.entity_id = Number(entity_id);
  }

  if (from_date || to_date) {
    where.created_at = {};
    if (from_date) where.created_at[Op.gte] = new Date(from_date);
    if (to_date) where.created_at[Op.lte] = new Date(to_date);
  }

  return AuditLog.findAndCountAll({
    where,
    include: [
      {
        model: User,
        attributes: ["id", "name", "username"],
        where: { school_id }, // 🔒 multi-tenant safety
      },
    ],
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });
};
