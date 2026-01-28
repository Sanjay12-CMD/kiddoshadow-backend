import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const ReportCardMark = db.define(
  "report_card_mark",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    report_card_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    subject_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    marks_obtained: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    max_marks: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    tableName: "report_card_marks",
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ["report_card_id"] },
      { fields: ["subject_id"] },
    ],
  }
);

export default ReportCardMark;
