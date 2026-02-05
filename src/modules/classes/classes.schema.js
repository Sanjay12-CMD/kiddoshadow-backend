// src/modules/classes/classes.schema.js
import Joi from "joi";

export const createClassSchema = Joi.object({
  class_name: Joi.string().trim().min(1).max(50).required(),
});

export const updateClassSchema = Joi.object({
  class_name: Joi.string().trim().min(1).max(50).optional(),
  is_active: Joi.boolean().optional(),
});
