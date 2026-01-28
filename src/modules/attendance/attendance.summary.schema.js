import { z } from "zod";

export const markAttendanceSchema = z.object({
  body: z.object({
    class_id: z.number().int(),
    section_id: z.number().int(),
    date: z.string(),
    records: z.array(
      z.object({
        student_id: z.number().int(),
        status: z.enum(["present", "absent", "leave"]),
      })
    ).min(1),
  }),
});

export const attendanceSummarySchema = z.object({
  query: z.object({
    class_id: z.string().optional(),
    section_id: z.string().optional(),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
    limit: z.string().optional(),
    offset: z.string().optional(),
  }),
});
