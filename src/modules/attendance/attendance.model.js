import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const Attendance = db.define(
  "attendance",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    school_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "schools",
        key: "id",
      },
    },

    student_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "students",
        key: "id",
      },
    },

    class_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "classes",
        key: "id",
      },
    },

    section_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "sections",
        key: "id",
      },
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("present", "absent", "leave"),
      allowNull: false,
    },

    marked_by: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    tableName: "attendances",
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["student_id", "date"],
      },
      { fields: ["school_id"] },
      { fields: ["class_id"] },
      { fields: ["section_id"] },
      { fields: ["date"] },
      { fields: ["marked_by"] },
    ],
  }
);

export default Attendance;
