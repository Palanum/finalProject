// models/Comment.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // adjust path

const Comment = sequelize.define('Comment', {
    CommentID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    RecipeID: { type: DataTypes.INTEGER, allowNull: true },
    UserID: { type: DataTypes.INTEGER, allowNull: true },
    ParentCommentID: { type: DataTypes.INTEGER, allowNull: true },
    Content: { type: DataTypes.TEXT, allowNull: true },
    type: { type: DataTypes.ENUM('normal', 'alarm'), allowNull: true },
    CreatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
    tableName: 'comments',
    timestamps: false,
});


module.exports = Comment;
