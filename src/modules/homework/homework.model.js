import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const Homework = db.define(
  "homework",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    school_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    class_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    section_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    subject_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    homework_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    created_by: {
      type: DataTypes.BIGINT, // teacher_id (user)
      allowNull: false,
    },
  },
  {
    tableName: "homeworks",
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ["school_id"] },
      { fields: ["class_id", "section_id"] },
      { fields: ["homework_date"] },
    ],
  }
);

export default Homework;
