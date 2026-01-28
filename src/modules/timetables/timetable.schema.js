import { z } from "zod";

/* teacher/admin: create or update timetable */
export const saveTimetableSchema = z.object({
  class_id: z.number().int().positive(),
  section_id: z.number().int().positive(),
  day_of_week: z.enum([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ]),
  entries: z
    .array(
      z.object({
        start_time: z.string(), // HH:mm
        end_time: z.string(),
        subject_id: z.number().int().positive().optional(),
        title: z.string().optional(),
        is_break: z.boolean(),
      })
    )
    .min(1),
});
