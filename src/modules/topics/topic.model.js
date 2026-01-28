import { DataTypes } from "sequelize";
import db from "../../config/db.js";
// imports removed

const Topic = db.define(
  "topic",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    chapter_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "chapters", key: "id" },
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    difficulty_hint: {
      type: DataTypes.ENUM("easy", "medium", "hard"),
      allowNull: false,
      defaultValue: "medium",
    },

    order_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "topics",
    underscored: true,
    indexes: [
      { fields: ["chapter_id"] },
      { unique: true, fields: ["chapter_id", "order_index"] },
      { unique: true, fields: ["chapter_id", "name"] }, // 🔒 REQUIRED
    ],
  }
);

export default Topic;
