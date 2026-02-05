import { z } from "zod";

export const startClassSessionSchema = z.object({
  teacher_assignment_id: z.number().int().positive(),
  timetable_id: z.number().int().positive().optional(),
});

export const endClassSessionSchema = z.object({});
