import { z } from "zod";

export const bulkCreateDataSchema = z.object({
  classes: z.union([
    z.record(z.string(), z.object({
      sections: z.union([
        z.number().int().min(1),
        z.array(z.object({
          name: z.string(),
          students: z.number().int().min(1)
        }))
      ]),
    })),
    z.array(z.object({
      name: z.string(),
      sections: z.array(z.object({
        name: z.string(),
        students: z.number().int().min(1)
      }))
    }))
  ]),
  teacher_count: z.number().int().min(1).optional(),
  students_per_section: z.number().int().min(1).optional(),
});
