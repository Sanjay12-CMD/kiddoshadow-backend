import { DataTypes } from "sequelize";
import db from "../../config/db.js";
// imports removed

const TeacherContent = db.define(
  "teacher_content",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    teacher_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "teachers", key: "id" },
    },

    chapter_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: "chapters", key: "id" },
    },

    topic_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: "topics", key: "id" },
    },

    content_type: {
      type: DataTypes.ENUM(
        "lesson_note",
        "question_bank",
        "diagram",
        "solution",
        "explanation"
      ),
      allowNull: false,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    attachment_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "teacher_contents",
    underscored: true,
    indexes: [
      { fields: ["teacher_id"] },
      { fields: ["chapter_id"] },
      { fields: ["topic_id"] },
      {
        unique: true,
        fields: ["teacher_id", "topic_id", "content_type"],
      },
    ],
  }
);

export default TeacherContent;
