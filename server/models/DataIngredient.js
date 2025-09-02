// models/DataIngredient.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // adjust path

const DataIngredient = sequelize.define('DataIngredient', {
    RawIngredientID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name_eng: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    name_th: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    calories: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
    },
    protein: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
    },
    fat: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
    },
    carbs: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
    },
    external_id: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    source: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    last_checked_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    }
}, {
    tableName: 'data_ingredients',
    timestamps: false,
});

module.exports = DataIngredient;
