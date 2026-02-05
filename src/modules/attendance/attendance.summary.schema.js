import { z } from "zod";

export const markAttendanceSchema = z.object({
  teacher_class_session_id: z.number().int().positive(),
  records: z.array(
    z.object({
      student_id: z.number().int().positive(),
      status: z.enum(["present", "absent", "leave"]),
    })
  ).min(1),
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
