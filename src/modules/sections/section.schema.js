import { z } from "zod";

export const createSectionSchema = z.object({
  body: z.object({
    class_id: z.number().int(),
    name: z.string().min(1).max(10),
  }),
});

export const updateSectionStatusSchema = z.object({
  body: z.object({
    is_active: z.boolean(),
  }),
});
