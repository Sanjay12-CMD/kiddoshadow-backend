import { z } from "zod";

export const createSchoolSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  cbse_affiliation_no: z.string().min(1),
  admin_username: z.string().min(3),
  admin_password: z.string().min(6),
});

export const updateSchoolStatusSchema = z.object({
  status: z.enum(["pending", "active", "suspended", "expired"]),
});

export const updateSchoolAdminStatusSchema = z.object({
  is_active: z.boolean(),
});                                                                                                                                                                                  

export const resetSchoolAdminPasswordSchema = z.object({
  new_password: z.string().min(6),
});
