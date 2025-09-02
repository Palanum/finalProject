// models/Ingredient.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // adjust path

const Ingredient = sequelize.define('Ingredient', {
    IngredientID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    RecipeID: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    RawIngredientID: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    Quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    Unit: {
        type: DataTypes.STRING(50),
        allowNull: true,
    }
}, {
    tableName: 'ingredients',
    timestamps: false,
});

module.exports = Ingredient;
