// models/ReportEvidence.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // adjust path

const ReportEvidence = sequelize.define('ReportEvidence', {
    EvidenceID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    ReportID: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    file_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    file_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    created_on: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'report_evidences',
    timestamps: false,
});

module.exports = ReportEvidence;