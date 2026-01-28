// src/modules/classes/classes.schema.js
import Joi from "joi";

export const createClassSchema = Joi.object({
  class_name: Joi.string().trim().min(1).max(50).required(),
  capacity: Joi.number().integer().min(1).max(500).optional(),
  class_teacher_id: Joi.number().integer().allow(null),
});

export const updateClassSchema = Joi.object({
  class_name: Joi.string().trim().min(1).max(50).optional(),
  capacity: Joi.number().integer().min(1).max(500).optional(),
  class_teacher_id: Joi.number().integer().allow(null),
  is_active: Joi.boolean().optional(),
});
