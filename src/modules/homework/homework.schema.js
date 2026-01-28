import { z } from "zod";

/* teacher: create */
export const createHomeworkSchema = z.object({
  class_id: z.number().int().positive(),
  section_id: z.number().int().positive(),
  subject_id: z.number().int().positive(),
  homework_date: z.string(), // YYYY-MM-DD
  description: z.string().min(1),
});

/* list */
export const listHomeworkSchema = z.object({
  class_id: z.number().int().positive().optional(),
  section_id: z.number().int().positive().optional(),
  date: z.string().optional(),
});


export const submitHomeworkSchema = z.object({
  is_completed: z.boolean(),
  remark: z.string().optional(),
});