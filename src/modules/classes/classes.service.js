// src/modules/classes/classes.service.js
import Class from "./classes.model.js";
import Section from "../sections/section.model.js";

export const createClassService = async ({
  school_id,
  class_name,
  capacity,
  class_teacher_id,
}) => {
  return await Class.create({
    school_id,
    class_name,
    capacity,
    class_teacher_id,
  });
};

export const getClassesService = async (school_id) => {
  return await Class.findAll({
    where: { school_id },
    include: [
      {
        model: Section,
        attributes: ["id", "name", "capacity", "is_active"],
      },
    ],
    order: [["class_name", "ASC"]],
  });
};

export const getClassByIdService = async (id, school_id) => {
  return await Class.findOne({
    where: { id, school_id },
    include: [
      {
        model: Section,
        attributes: ["id", "name", "capacity", "is_active"],
      },
    ],
  });
};

export const updateClassService = async (id, school_id, payload) => {
  const cls = await Class.findOne({ where: { id, school_id } });

  if (!cls) return null;

  await cls.update(payload);
  return cls;
};

export const deleteClassService = async (id, school_id) => {
  const cls = await Class.findOne({ where: { id, school_id } });

  if (!cls) return null;

  await cls.destroy();
  return true;
};
