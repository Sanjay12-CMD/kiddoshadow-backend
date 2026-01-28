import { DataTypes } from "sequelize";
import db from "../../config/db.js";


const AiOutput = db.define("ai_output", {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },

    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: "users", key: "id" },
    },

    subject_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: { model: "subjects", key: "id" },
    },

    topic_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: { model: "topics", key: "id" },
    },

    purpose: {
        type: DataTypes.ENUM(
            "lesson_outline",
            "teaching_points",
            "homework_ideas",
            "study_plan",
            "question_paper"
        ),
        allowNull: false,
    },

    input_context: {
        type: DataTypes.JSONB,
    },

    output_content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    tableName: "ai_outputs",
    underscored: true,
    indexes: [
        { fields: ["user_id"] },
        { fields: ["topic_id"] },
    ],
});

export default AiOutput;
