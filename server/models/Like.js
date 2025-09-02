// models/Like.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // adjust path

const Like = sequelize.define('Like', {
    UserID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    RecipeID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    CreatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'likes',
    timestamps: false, // since CreatedAt is managed manually
});

module.exports = Like;
