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
      school_id: req.user.school_id,
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
        school_id: req.user.school_id,
        query: req.query,
      }),
      getPendingParentApprovalsService({
        school_id: req.user.school_id, // ✅ FIXED
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
