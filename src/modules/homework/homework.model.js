import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const Homework = db.define("homework", {
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

  teacher_assignment_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },

  subject_id: {
    type: DataTypes.BIGINT,
    allowNull: false, // derived from assignment
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
    type: DataTypes.BIGINT, // user_id
    allowNull: false,
  },
}, {
  tableName: "homeworks",
  underscored: true,
  timestamps: true,
  indexes: [
    { fields: ["school_id"] },
    { fields: ["class_id", "section_id"] },
    { fields: ["teacher_assignment_id"] },
    { fields: ["homework_date"] },
  ],
});

export default Homework;
