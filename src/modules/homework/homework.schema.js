import { z } from "zod";

/* teacher: create */
export const createHomeworkSchema = z.object({
  class_id: z.coerce.number().int().positive(),
  section_id: z.coerce.number().int().positive(),
  teacher_assignment_id: z.coerce.number().int().positive(),
  subject_id: z.coerce.number().int().positive().optional(),
  homework_date: z.string(), // YYYY-MM-DD
  description: z.string().min(1),
});

/* list */
export const listHomeworkSchema = z.object({
  query: z.object({
    class_id: z.coerce.number().int().positive().optional(),
    section_id: z.coerce.number().int().positive().optional(),
    student_id: z.coerce.number().int().positive().optional(),
    date: z.string().optional(), // due date filter
    created_date: z.string().optional(), // created_at filter (YYYY-MM-DD)
  }),
});


export const submitHomeworkSchema = z.object({
  is_completed: z.boolean(),
  remark: z.string().optional(),
});
