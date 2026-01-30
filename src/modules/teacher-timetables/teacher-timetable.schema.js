import { z } from "zod";

export const createTeacherTimetableSchema = z.object({
  teacher_id: z.number(),
  day_of_week: z.number().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
  class_id: z.number(),
  section_id: z.number(),
  subject_id: z.number(),
});
