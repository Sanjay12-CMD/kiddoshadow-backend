import { DataTypes, Op } from "sequelize";
import db from "../../config/db.js";

const TopicProgress = db.define(
  "topic_progress",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    topic_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "topics", key: "id" },
    },

    class_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: "classes", key: "id" },
    },

    student_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: "students", key: "id" },
    },

    status: {
      type: DataTypes.ENUM("not_started", "taught", "revised", "tested"),
      allowNull: false,
      defaultValue: "not_started",
    },

    revision_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    last_updated_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: "teachers", key: "id" },
    },
  },
  {
    tableName: "topic_progresses",
    underscored: true,
    indexes: [
      {
        name: "topic_progress_class_unique",
        unique: true,
        fields: ["topic_id", "class_id"],
        where: { student_id: null },
      },
      {
        name: "topic_progress_student_unique",
        unique: true,
        fields: ["topic_id", "class_id", "student_id"],
        where: { student_id: { [Op.ne]: null } },
      },
      { fields: ["class_id"] },
      { fields: ["student_id"] },
      { fields: ["topic_id", "class_id"] },
      { fields: ["last_updated_by"] },
    ],
  }
);

export default TopicProgress;
