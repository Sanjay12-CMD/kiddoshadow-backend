import asyncHandler from "../../shared/asyncHandler.js";
import * as service from "./teacher-class-session.service.js";

export const startClass = asyncHandler(async (req, res) => {
  const session = await service.startSession({
    schoolId: req.user.school_id,
    teacherId: req.user.id,
    classId: req.body.class_id,
    sectionId: req.body.section_id,
    subjectId: req.body.subject_id,
  });

  res.status(201).json(session);
});

export const endClass = asyncHandler(async (req, res) => {
  const session = await service.endSession(
    req.params.id
  );

  if (!session) {
    return res.status(400).json({ message: "Invalid session" });
  }

  res.json(session);
});
