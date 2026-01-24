import { DataTypes } from "sequelize";
import db from "../../config/db.js";
// imports removed

const AiChatLog = db.define(
  "ai_chat_log",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    user_query: {
      type: DataTypes.TEXT,
    },
    ai_response: {
      type: DataTypes.TEXT,
    },
    token_cost: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "ai_chat_logs",
    underscored: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["created_at"] }
    ]
  }
);

export default AiChatLog;

