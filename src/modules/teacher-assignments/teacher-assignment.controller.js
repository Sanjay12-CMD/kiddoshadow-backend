import asyncHandler from "../../shared/asyncHandler.js";
import * as service from "./teacher-assignment.service.js";

export const assignTeacher = asyncHandler(async (req, res) => {
  const assignment = await service.assignTeacher({
    schoolId: req.user.school_id,
    teacherId: req.body.teacher_id,
    classId: req.body.class_id,
    sectionId: req.body.section_id,
    subjectId: req.body.subject_id,
  });

  res.status(201).json(assignment);
});
