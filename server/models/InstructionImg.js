// models/InstructionImg.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // adjust path
const Instruction = require('./Instruction');

const InstructionImg = sequelize.define('InstructionImg', {
    instruction_imgID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    instructionID: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    imageURL: {
        type: DataTypes.STRING(1000),
        allowNull: true,
    }
}, {
    tableName: 'instruction_img',
    timestamps: false,
});

module.exports = InstructionImg;
