import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const TeacherTimetable = db.define(
  "teacher_timetable",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

       school_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "schools",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    teacher_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "teachers",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    day_of_week: {
      type: DataTypes.SMALLINT,
      allowNull: false, // 0=Sunday … 6=Saturday
    },

    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },

    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },

    class_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "classes",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    section_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "sections",
        key: "id",
      },
      onDelete: "CASCADE",
    },
  subject_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "subjects",
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "teacher_timetables",
    underscored: true,
    indexes: [
      { fields: ["teacher_id"] },
      { fields: ["day_of_week"] },
    ],
  }
);

export default TeacherTimetable;
