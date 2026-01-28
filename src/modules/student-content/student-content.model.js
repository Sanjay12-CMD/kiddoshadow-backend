import { DataTypes } from "sequelize";
import db from "../../config/db.js";
// imports removed

const StudentContent = db.define(
  "student_content",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    student_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "students", key: "id" },
    },

    topic_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: "topics", key: "id" },
    },

    content_type: {
      type: DataTypes.ENUM(
        "cheat_sheet",
        "formula_list",
        "notes",
        "mistake_log",
        "favorite_explanation"
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
  },
  {
    tableName: "student_contents",
    underscored: true,
    indexes: [
      { fields: ["student_id"] },
      { fields: ["topic_id"] },
      {
        unique: true,
        fields: ["student_id", "topic_id", "content_type"],
      },
    ],
  }
);

// Associations
export default StudentContent;
