import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const Timetable = db.define(
  "timetable",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    school_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    class_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    section_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    day_of_week: {
      type: DataTypes.ENUM(
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday"
      ),
      allowNull: false,
    },

    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },

    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },

    subject_id: {
      type: DataTypes.BIGINT,
      allowNull: true, // NULL = break
    },

    title: {
      type: DataTypes.STRING,
      allowNull: true, // "Lunch Break", "Short Break"
    },

    is_break: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "timetables",
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ["school_id"] },
      { fields: ["class_id", "section_id"] },
      { fields: ["day_of_week"] },
    ],
  }
);

export default Timetable;
