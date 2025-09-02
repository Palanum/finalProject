// models/RecipeCategory.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // adjust path

const RecipeCategory = sequelize.define('RecipeCategory', {
    RecipeID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    CategoryID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
}, {
    tableName: 'recipe_category',
    timestamps: false,
});

module.exports = RecipeCategory;