import Exam from "./exam.model.js";
import AppError from "../../shared/appError.js";
import { getPagination } from "../../shared/utils/pagination.js";

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

  if (exists) throw new AppError("EXAM_EXISTS", 409);

  const exam = await Exam.create({
    school_id,
    class_id,
    name,
    start_date,
    end_date,
  });

  return exam;
};

export const lockExamService = async ({ exam_id }) => {
  const exam = await Exam.findByPk(exam_id);
  if (!exam) throw new AppError("EXAM_NOT_FOUND", 404);

  exam.is_locked = true;
  await exam.save();

  return exam;
};

export const listExamsByClassService = async ({
  school_id,
  class_id,
  query,
}) => {
  const { limit, offset } = getPagination(query);

  return Exam.findAndCountAll({
    where: { school_id, class_id },
    order: [["start_date", "DESC"]],
    limit,
    offset,
  });
};
