import { z } from "zod";

/* =========================
   ADMIN: CREATE PARENT + LINK
========================= */
export const createParentAndLinkSchema = z.object({
  body: z.object({
    username: z.string().min(3),
    links: z.array(
      z.object({
        student_id: z.number().int().positive(),
        relation_type: z.enum(["mother", "father", "guardian"]),
      })
    ).min(1),
  }),
});

/* =========================
   ADMIN: LINK EXISTING PARENT
========================= */
export const linkExistingParentSchema = z.object({
  body: z.object({
    parent_user_id: z.number().int().positive(),
    student_id: z.number().int().positive(),
    relation_type: z.enum(["mother", "father", "guardian"]),
  }),
});

/* =========================
   PARENT: UPDATE OWN PROFILE
========================= */
export const updateParentProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    phone: z.string().optional(),
  }),
});
