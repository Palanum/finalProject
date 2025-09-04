const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const RecipeView = sequelize.define('RecipeView', {
    viewID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    RecipeID: { type: DataTypes.INTEGER, allowNull: false },
    UserID: { type: DataTypes.INTEGER, allowNull: true },
    sessionId: { type: DataTypes.STRING, allowNull: true },
    view_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'recipe_view',
    timestamps: false
});

module.exports = RecipeView;
