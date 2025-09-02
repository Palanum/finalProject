// models/Instruction.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // adjust path

const Instruction = sequelize.define('Instruction', {
    instructionID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    RecipeID: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    details: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
}, {
    tableName: 'instruction',
    timestamps: false,
});


module.exports = Instruction;
