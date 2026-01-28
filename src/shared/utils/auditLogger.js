import AuditLog from "../../modules/audit/audit-log.model.js";

export const logApprovalAction = async ({
  entity_type,
  entity_id,
  action,
  remark,
  performed_by,
  transaction,
}) => {
  await AuditLog.create(
    {
      entity_type,
      entity_id,
      action,
      remark,
      performed_by,
    },
    transaction ? { transaction } : undefined
  );
};
