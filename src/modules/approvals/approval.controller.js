import {
  getPendingStudentApprovalsService,
  getPendingTeacherApprovalsService,
  getPendingParentApprovalsService,
} from "./approval.service.js";

/* =========================
   TEACHER DASHBOARD
========================= */
export const getTeacherPendingApprovals = async (req, res, next) => {
  try {
    const result = await getPendingStudentApprovalsService({
      user: req.user,
      class_id: req.query.class_id,
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

/* =========================
   ADMIN DASHBOARD
========================= */
export const getAdminPendingApprovals = async (req, res, next) => {
  try {
    const [teachers, parents] = await Promise.all([
      getPendingTeacherApprovalsService({
        user: req.user,
        query: req.query,
      }),
      getPendingParentApprovalsService({
        user: req.user, // FIXED: school scoped
        query: req.query,
      }),
    ]);

    res.json({
      teachers: {
        total: teachers.count,
        items: teachers.rows,
      },
      parents: {
        total: parents.count,
        items: parents.rows,
      },
    });
  } catch (e) {
    next(e);
  }
};

/* =========================
   ACTION
========================= */
export const approveRejectRequest = async (req, res, next) => {
  try {
    const { type, id, action } = req.params;
    const { rejection_reason } = req.body;

    const result = await import("./approval.service.js").then(m => m.processApprovalAction({
      user: req.user,
      type,
      id,
      action,
      rejection_reason
    }));

    res.json({ message: "Request processed successfully", result });
  } catch (e) {
    next(e);
  }
};
