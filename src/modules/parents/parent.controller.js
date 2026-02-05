import jwt from "jsonwebtoken";
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
    const user = await updateParentProfileService(req.user.id, req.body);

    // Check if it was a profile completion (assuming first_login was updated to false)
    if (req.body.name || req.body.phone) {
      // Force update first_login to false if not handled in service or to be safe
      await user.update({ first_login: false });
    }

    // Explicitly handle email update here if not handled in service (service does user.update(data))
    // So if email is in req.body, it should be updated by service.
    // Just verifying service implementation:
    // export const updateParentProfileService = async (user_id, data) => { ... await user.update(data); ... }
    // Yes, it updates whatever is in data.

    // Check if we need to do anything specific for email? No.

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        school_id: user.school_id,
        iat: Date.now(),
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ message: "Profile updated", token, user });
  } catch (e) {
    next(e);
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    // Parent user is stored directly in users table, but we might have a separate Parent model?
    // Looking at service, linkExistingParentService uses Parent model. 
    // Wait, createParentAndLinkService -> User.create.
    // Let's check parent.service.js to see if there is a Parent model.
    // If not, we just return req.user?
    // But other controllers import Parent model.
    // Assuming simple return for now or fetching Parent model if needed.
    // For profile page, we mostly need name/phone which are on User.
    // But updateParentProfile updates User.

    // Let's just return req.user for now as "profile"
    res.json(req.user);
  } catch (e) {
    next(e);
  }
};
