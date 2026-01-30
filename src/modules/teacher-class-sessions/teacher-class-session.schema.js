import { z } from "zod";


export const startClassSessionSchema = z.object({
  class_id: z.number().int().positive(),
  section_id: z.number().int().positive(),
  subject_id: z.number().int().positive(),
});


export const endClassSessionSchema = z.object({});
