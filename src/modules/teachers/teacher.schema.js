import { z } from "zod";

const emptyToUndefined = (val) => (val === "" ? undefined : val);


/* admin: status */
export const updateTeacherStatusSchema = z.object({
  is_active: z.boolean(),
});

/* teacher: complete profile */
export const completeTeacherProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.preprocess(emptyToUndefined, z.string().optional()),
  gender: z.enum(["male", "female", "other"]).optional(),
  designation: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.preprocess(emptyToUndefined, z.coerce.number().int().nonnegative().optional()),
  email: z.preprocess(emptyToUndefined, z.string().email().optional()),
  avatar_url: z.string().optional().or(z.literal("")).or(z.null()),
});
