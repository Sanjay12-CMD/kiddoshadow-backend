import School from "./school.model.js";
import User from "../users/user.model.js";
import AppError from "../../shared/appError.js";
import { getPagination } from "../../shared/utils/pagination.js";

/* =========================
   SUPER ADMIN: CREATE SCHOOL
========================= */
export const createSchoolService = async ({
  name,
  code,
  cbse_affiliation_no,
  address,
  city,
  state,
  zip,
  email,
  admin_username,
  admin_password,
}) => {
  const exists = await School.findOne({
    where: { school_code: code },
  });

  if (exists) {
    throw new AppError("School code already exists", 409);
  }

  const school = await School.create({
    school_name: name,
    school_code: code,
    cbse_affiliation_no,
    address,
    city,
    state,
    zip,
    email,
    status: "pending",
  });

  const existingUser = await User.findOne({
  where: { username: admin_username },
});

if (existingUser) {
  throw new AppError("Admin username already exists", 409);
}

  const admin = await User.create({
    role: "school_admin",
    school_id: school.id,
    username: admin_username,
    password: admin_password,
    first_login: true,
    is_active: true,
    name: "School Admin",
  });

  return {
    school,
    admin: { username: admin.username },
  };
};

/* =========================
   SUPER ADMIN: LIST SCHOOLS
========================= */
export const listSchoolsService = async ({ query }) => {
  const { limit, offset } = getPagination(query);
  return School.findAndCountAll({
    limit,
    offset,
    include: [
      {
        model: User,
        where: { role: "school_admin" },
        required: false,
        attributes: ["id", "username", "is_active", "first_login"],
      },
    ],
  });
};

/* =========================
   SUPER ADMIN: UPDATE SCHOOL STATUS
========================= */
export const updateSchoolStatusService = async ({ school_id, status }) => {
  const school = await School.findByPk(school_id);
  if (!school) {
    throw new AppError("School not found", 404);
  }

  school.status = status;
  await school.save();
  return school;
};

/* =========================
   SUPER ADMIN: SCHOOL ADMIN STATUS
========================= */
export const updateSchoolAdminStatusService = async ({
  school_id,
  is_active,
}) => {
  const admin = await User.findOne({
    where: { school_id, role: "school_admin" },
  });

  if (!admin) {
    throw new AppError("School admin not found", 404);
  }

  admin.is_active = is_active;
  await admin.save();
  return admin;
};

/* =========================
   SUPER ADMIN: RESET ADMIN PASSWORD
========================= */
export const resetSchoolAdminPasswordService = async ({
  school_id,
  new_password,
}) => {
  const admin = await User.findOne({
    where: { school_id, role: "school_admin" },
  });

  if (!admin) {
    throw new AppError("School admin not found", 404);
  }

  admin.password = new_password;
  admin.first_login = true;
  await admin.save();

  return { username: admin.username };
};
