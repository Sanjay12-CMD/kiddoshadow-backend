import {
  teacherCreateParentService,
  approveParentService,
} from "./parent.approval.service.js";

/* =========================
   TEACHER
========================= */
export const teacherCreateParent = async (req, res, next) => {
  try {
    const result = await teacherCreateParentService({
      teacher_school_id: req.user.school_id,
      ...req.body,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

/* =========================
   ADMIN
========================= */
export const approveParent = async (req, res, next) => {
  try {
    const result = await approveParentService({
      parent_id: req.params.parent_id,
      admin_user_id: req.user.id,
      school_id: req.user.school_id,
      action: req.body.action,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
};
