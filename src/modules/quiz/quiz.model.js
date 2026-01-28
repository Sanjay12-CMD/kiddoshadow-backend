import { DataTypes } from "sequelize";
import db from "../../config/db.js";
// imports removed

const Quiz = db.define(
  "quiz",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    owner_user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },

    topic_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "topics",
        key: "id",
      },
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    difficulty: {
      type: DataTypes.ENUM("EASY", "MEDIUM", "HARD", "ADAPTIVE"),
      allowNull: false,
    },

    num_questions: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "quizzes",
    underscored: true,
    indexes: [
      { fields: ["owner_user_id"] },
      { fields: ["topic_id"] },
    ],
  }
);

// Associations
export default Quiz;
