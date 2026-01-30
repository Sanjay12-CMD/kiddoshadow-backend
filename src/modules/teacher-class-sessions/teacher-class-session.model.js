import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const TeacherClassSession = db.define(
  "teacher_class_session",
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

    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    ended_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },



  },
  {
    tableName: "teacher_class_sessions",
    underscored: true,
    indexes: [
      { fields: ["teacher_id"] },
      { fields: ["started_at"] },
    ],
  }
);

export default TeacherClassSession;
