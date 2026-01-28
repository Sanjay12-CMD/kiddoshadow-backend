import { z } from "zod";

/* admin / teacher: create announcement */
export const createNotificationSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),

  target_role: z.enum(["teacher", "parent", "student", "all"]),

  class_id: z.number().int().positive().optional(),
  section_id: z.number().int().positive().optional(),
});


/* parent / teacher: acknowledge */
export const acknowledgeNotificationSchema = z.object({});
