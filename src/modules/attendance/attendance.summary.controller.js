import {
  markAttendanceService,
  getTeacherAttendanceSummaryService,
  getParentAttendanceSummaryService,
} from "./attendance.summary.service.js";

/* =========================
   TEACHER: MARK
========================= */
export const markAttendance = async (req, res, next) => {
  try {
    const result = await markAttendanceService({
      school_id: req.user.school_id,
      teacher_user_id: req.user.id,
      ...req.body,
    });

    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

/* =========================
   TEACHER: SUMMARY
========================= */
export const getTeacherAttendanceSummary = async (req, res, next) => {
  try {
    const result = await getTeacherAttendanceSummaryService({
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

/* =========================
   PARENT: SUMMARY
========================= */
export const getParentAttendanceSummary = async (req, res, next) => {
  try {
    const result = await getParentAttendanceSummaryService({
      parent_user_id: req.user.id,
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
