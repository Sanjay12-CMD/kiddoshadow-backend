import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const TeacherAssignment = db.define(
  "teacher_assignment",
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

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "teacher_assignments",
    underscored: true,
    indexes: [
      { fields: ["school_id"] },
      { fields: ["teacher_id"] },
      {
        unique: true,
        fields: ["teacher_id", "section_id", "subject_id"],
      },
    ],
  }
);

export default TeacherAssignment;
