import { listAuditLogsService } from "./audit.service.js";

export const listAuditLogs = async (req, res, next) => {
  try {
    const result = await listAuditLogsService({
      school_id: req.user.school_id,
      query: req.query,
    });

    res.json({
      total: result.count,
      items: result.rows,
    });
  } catch (e) {
    next(e);
  }
};
