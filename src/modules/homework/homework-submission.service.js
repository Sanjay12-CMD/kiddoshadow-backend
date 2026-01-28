import Homework from "./homework.model.js";
import HomeworkSubmission from "./homework-submission.model.js";

export const submitHomeworkService = async ({
  school_id,
  homework_id,
  student_id,
  is_completed,
  remark,
}) => {
  // Validate homework exists
  const homework = await Homework.findOne({
    where: { id: homework_id, school_id },
  });

  if (!homework) {
    return { error: "HOMEWORK_NOT_FOUND" };
  }

  const [submission, created] = await HomeworkSubmission.findOrCreate({
    where: { homework_id, student_id },
    defaults: {
      is_completed,
      remark,
    },
  });

  if (!created) {
    submission.is_completed = is_completed;
    submission.remark = remark;
    await submission.save();
  }

  return { submission };
};
