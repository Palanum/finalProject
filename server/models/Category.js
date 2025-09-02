// models/Category.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // adjust path to your sequelize instance

const Category = sequelize.define('Category', {
    CategoryID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    Name: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    tableName: 'categories',
    timestamps: false, // table does not have created_at / updated_at
});

module.exports = Category;
