// models/Favorite.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // adjust path

const Favorite = sequelize.define('Favorite', {
    UserID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
    },
    RecipeID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
    },
    CreatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
}, {
    tableName: 'favorites',
    timestamps: false,
});

module.exports = Favorite;
