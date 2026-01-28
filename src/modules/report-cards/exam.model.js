import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const Exam = db.define(
  "exam",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    school_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    class_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    is_locked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "exams",
    underscored: true,
    indexes: [
      { fields: ["school_id"] },
      { fields: ["class_id"] },
      { unique: true, fields: ["school_id", "class_id", "name"] },
    ],
  }
);

export default Exam;
