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
  email: z.string().email().optional(),
  dob: z.string().optional(), // or z.coerce.date()
  gender: z.enum(["male", "female", "other"]).optional(),
  blood_group: z.string().optional(),
  father_name: z.string().optional(),
  mother_name: z.string().optional(),
  guardian_name: z.string().optional(),
  father_occupation: z.string().optional(),
  mother_occupation: z.string().optional(),
  address: z.string().optional(),
  family_income: z.coerce.number().optional(),
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