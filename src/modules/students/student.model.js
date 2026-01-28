import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const Student = db.define(
  "student",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
      references: {
        model: "users",
        key: "id",
      },
    },

    school_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "schools",
        key: "id",
      },
    },

    class_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "classes",
        key: "id",
      },
    },

    admission_no: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    profile_pic: DataTypes.TEXT,

    dob: DataTypes.DATEONLY,

    gender: {
      type: DataTypes.ENUM("male", "female", "other"),
    },

    father_name: DataTypes.STRING,
    mother_name: DataTypes.STRING,
    guardian_name: DataTypes.STRING,

    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    blood_group: DataTypes.STRING,

    aadhar_no: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },

    father_occupation: DataTypes.STRING,
    mother_occupation: DataTypes.STRING,

    family_income: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    approval_status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },

    approved_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
  rejection_reason: {
  type: DataTypes.TEXT,
  allowNull: true,
},
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "students",
    underscored: true,
    indexes: [
      { fields: ["school_id"] },
      { fields: ["class_id"] },
      { fields: ["user_id"] },
      { unique: true, fields: ["school_id", "admission_no"] },
    ],
  }
);

export default Student;
