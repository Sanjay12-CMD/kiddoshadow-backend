import {
  createParentAndLinkService,
  linkExistingParentService,
  updateParentProfileService,
} from "./parent.service.js";

/* =========================
   ADMIN
========================= */
export const createParentAndLink = async (req, res, next) => {
  try {
    const result = await createParentAndLinkService({
      school_id: req.user.school_id,
      ...req.body,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

export const linkExistingParent = async (req, res, next) => {
  try {
    const result = await linkExistingParentService({
      school_id: req.user.school_id,
      ...req.body,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

/* =========================
   PARENT
========================= */
export const updateParentProfile = async (req, res, next) => {
  try {
    const result = await updateParentProfileService(req.user.id, req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
};
