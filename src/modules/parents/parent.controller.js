import jwt from "jsonwebtoken";
import {
  createParentAndLinkService,
  linkExistingParentService,
  updateParentProfileService,
  listParentsService,
  listParentOptionsService,
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

export const listParents = async (req, res, next) => {
  try {
    const result = await listParentsService({
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

export const listParentOptions = async (req, res, next) => {
  try {
    const result = await listParentOptionsService({
      school_id: req.user.school_id,
    });

    res.json({
      total: result.length,
      items: result,
    });
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
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

    res.json({ message: "Profile updated", token, user });
  } catch (e) {
    next(e);
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    const Parent = (await import("./parent.model.js")).default;
    const User = (await import("../users/user.model.js")).default;
    const Student = (await import("../students/student.model.js")).default;
    const Class = (await import("../classes/classes.model.js")).default;
    const Section = (await import("../sections/section.model.js")).default;

    const parent = await Parent.findOne({
      where: { user_id: req.user.id },
      include: [
        {
          model: User,
          required: false,
        },
        {
          model: Student,
          required: false,
          include: [
            {
              model: User,
              required: false,
            },
            {
              model: Class,
              required: false,
            },
            {
              model: Section,
              required: false,
            },
          ],
        },
      ],
    });

    if (!parent) {
      return res.json(req.user);
    }

    const parentData = parent.toJSON();
    const parentUser = parentData.user || {};
    const linkedStudentUser = parentData.student?.user || {};
    const resolvedPhone = parentUser.phone || linkedStudentUser.phone || "";

    res.json({
      ...parentData,
      phone: resolvedPhone,
      user: {
        ...parentUser,
        phone: resolvedPhone,
      },
    });
  } catch (e) {
    next(e);
  }
};
