import { z } from "zod";

/* admin: auto create */
export const autoCreateStudentsSchema = z.object({
  class_id: z.number(),
  sections: z.array(
    z.object({
      section_id: z.number(),
      count: z.number().int().positive(),
    })
  ).min(1),
});

/* student: first login */
export const completeStudentProfileSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
});

/* admin: move */
export const moveStudentSchema = z.object({
  section_id: z.number(),
});

/* admin: status */
export const updateStudentStatusSchema = z.object({
  is_active: z.boolean(),
});


/* admin: bulk assign students to section */
export const assignStudentsToSectionSchema = z.object({
  target_class_id: z.number().int().positive(),
  target_section_id: z.number().int().positive(),
  students: z
    .array(
      z.object({
        student_id: z.number().int().positive(),
        roll_no: z.number().int().positive(),
      })
    )
    .min(1),
});