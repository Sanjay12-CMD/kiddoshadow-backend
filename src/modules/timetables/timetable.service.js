import db from "../../config/db.js";
import Timetable from "./timetable.model.js";
import Section from "../sections/section.model.js";

export const saveTimetableService = async ({
  school_id,
  class_id,
  section_id,
  day_of_week,
  entries,
}) => {
  return db.transaction(async (t) => {
    // validate section
    const section = await Section.findOne({
      where: { id: section_id, class_id, school_id, is_active: true },
      transaction: t,
    });

    if (!section) {
      return { error: "SECTION_NOT_FOUND" };
    }

    // remove existing timetable for that day
    await Timetable.destroy({
      where: { school_id, class_id, section_id, day_of_week },
      transaction: t,
    });

    // insert new entries
    for (const e of entries) {
      await Timetable.create(
        {
          school_id,
          class_id,
          section_id,
          day_of_week,
          start_time: e.start_time,
          end_time: e.end_time,
          subject_id: e.is_break ? null : e.subject_id,
          title: e.is_break ? e.title : null,
          is_break: e.is_break,
        },
        { transaction: t }
      );
    }

    return { success: true };
  });
};

export const getTimetableService = async ({
  school_id,
  class_id,
  section_id,
}) => {
  return Timetable.findAll({
    where: { school_id, class_id, section_id },
    order: [
      ["day_of_week", "ASC"],
      ["start_time", "ASC"],
    ],
  });
};
