import asyncHandler from "../../shared/asyncHandler.js";
import {
  createSchoolService,
  getSchoolDetailsService,
  listSchoolsService,
  updateSchoolStatusService,
  updateSchoolAdminStatusService,
  resetSchoolAdminPasswordService,
} from "./school.service.js";

/* CREATE SCHOOL */
export const createSchool = asyncHandler(async (req, res) => {
  const result = await createSchoolService(req.body);
  res.status(201).json(result);
});

/* LIST SCHOOLS */
export const listSchools = asyncHandler(async (req, res) => {
  const schools = await listSchoolsService({ query: req.query });
  res.json(schools);
});

/* UPDATE SCHOOL STATUS */
export const updateSchoolStatus = asyncHandler(async (req, res) => {
  const school = await updateSchoolStatusService({
    school_id: req.params.id,
    status: req.body.status,
  });

  res.json({ message: "Status updated", school });
});

/* UPDATE SCHOOL ADMIN STATUS */
export const updateSchoolAdminStatus = asyncHandler(async (req, res) => {
  const admin = await updateSchoolAdminStatusService({
    school_id: req.params.id,
    is_active: req.body.is_active,
  });

  res.json({ message: "School admin status updated", admin });
});

/* RESET SCHOOL ADMIN PASSWORD */
export const resetSchoolAdminPassword = asyncHandler(async (req, res) => {
  const result = await resetSchoolAdminPasswordService({
    school_id: req.params.id,
    new_password: req.body.new_password,
  });

  res.json({ message: "Password reset", admin: result });
});

/* SCHOOL DETAILS */
export const getSchoolDetails = asyncHandler(async (req, res) => {
  const school = await getSchoolDetailsService({
    requester: req.user,
    school_id: req.params.id,
  });

  res.json({
    success: true,
    data: school,
  });
});
