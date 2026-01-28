import { z } from "zod";

export const createExamSchema = z.object({
  class_id: z.number().int().positive(),
  name: z.string().min(1),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const lockExamSchema = z.object({
  is_locked: z.literal(true),
});
