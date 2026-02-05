import asyncHandler from "../../shared/asyncHandler.js";
import { bulkCreateDataService } from "./bulk.service.js";

export const bulkCreateData = asyncHandler(async (req, res) => {
  const { classes, teacher_count, students_per_section } = req.body;
  const school_id = req.user.school_id;

  const result = await bulkCreateDataService({
    school_id,
    classes,
    teacher_count,
    students_per_section,
  });

  res.status(201).json({
    message: "Data created successfully",
    summary: result,
  });
});
