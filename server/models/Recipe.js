// models/Recipe.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // adjust path

const Recipe = sequelize.define('Recipe', {
    RecipeID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    UserID: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    Title: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    ImageURL: {
        type: DataTypes.STRING(1000),
        allowNull: true,
    },
    videoURL: {
        type: DataTypes.STRING(1000),
        allowNull: true,
    },
    time: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
}, {
    tableName: 'recipes',
    timestamps: false,
});
module.exports = Recipe;
