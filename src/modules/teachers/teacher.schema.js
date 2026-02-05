import { z } from "zod";


/* admin: status */
export const updateTeacherStatusSchema = z.object({
  is_active: z.boolean(),
});

/* teacher: complete profile */
export const completeTeacherProfileSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  designation: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.coerce.number().int().nonnegative().optional(),
  email: z.string().email().optional(),
});
