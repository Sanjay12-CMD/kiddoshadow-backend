import Exam from "./exam.model.js";

export const createExamService = async ({
  school_id,
  class_id,
  name,
  start_date,
  end_date,
}) => {
  const exists = await Exam.findOne({
    where: { school_id, class_id, name },
  });

  if (exists) return { error: "EXAM_EXISTS" };

  const exam = await Exam.create({
    school_id,
    class_id,
    name,
    start_date,
    end_date,
  });

  return { exam };
};

export const lockExamService = async ({ exam_id }) => {
  const exam = await Exam.findByPk(exam_id);
  if (!exam) return null;

  exam.is_locked = true;
  await exam.save();

  return exam;
};

export const listExamsByClassService = async ({
  school_id,
  class_id,
}) => {
  return Exam.findAll({
    where: { school_id, class_id },
    order: [["created_at", "DESC"]],
  });
};
