import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const ReportCard = db.define(
  "report_card",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    student_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    class_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    exam_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "report_cards",
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ["student_id"] },
      { fields: ["exam_id"] },
      {
        unique: true,
        fields: ["student_id", "exam_id"],
      },
    ],
  }
);

export default ReportCard;
