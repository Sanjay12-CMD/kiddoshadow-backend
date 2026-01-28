import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const AuditLog = db.define(
  "audit_log",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    entity_type: {
      type: DataTypes.ENUM("student", "teacher", "parent"),
      allowNull: false,
    },

    entity_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    action: {
      type: DataTypes.ENUM("approve", "reject"),
      allowNull: false,
    },

    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    performed_by: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    tableName: "audit_logs",
    underscored: true,
    indexes: [
      { fields: ["entity_type", "entity_id"] },
      { fields: ["performed_by"] },
    ],
  }
);

export default AuditLog;
