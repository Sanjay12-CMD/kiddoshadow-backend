import { z } from "zod";

export const assignTeacherSchema = z.object({
  teacher_id: z.number().int().positive(),
  class_id: z.number().int().positive(),
  section_id: z.number().int().positive(),
  subject_id: z.number().int().positive(),
  is_class_teacher: z.boolean().optional().default(false),
});

export const updateTeacherAssignmentSchema = z.object({
  is_active: z.boolean().optional(),
  is_class_teacher: z.boolean().optional(),
});

