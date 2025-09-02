// models/Report.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Report = sequelize.define('Report', {
    ReportID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    Reporter_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    reported_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    reported_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    created_on: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'report',
    timestamps: false,
});


module.exports = Report;
