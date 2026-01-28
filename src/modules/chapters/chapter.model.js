import { DataTypes } from "sequelize";
import db from "../../config/db.js";
// imports removed

const Chapter = db.define("chapter", {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },

    subject_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: "subjects", key: "id" },
    },

    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    order_index: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    tableName: "chapters",
    underscored: true,
    indexes: [
        { fields: ["subject_id"] },
        { unique: true, fields: ["subject_id", "order_index"] },
        { unique: true, fields: ["subject_id", "name"] },
    ],
});

export default Chapter;
