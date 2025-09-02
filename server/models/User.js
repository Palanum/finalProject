const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING },
    password_hash: { type: DataTypes.STRING },
    role: { type: DataTypes.ENUM('admin', 'user'), defaultValue: 'user' },
    status: { type: DataTypes.ENUM('normal', 'banned'), defaultValue: 'normal' },
    stat_update: { type: DataTypes.DATE },
    last_alarm_view: { type: DataTypes.DATE },
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at', // map to existing column
    updatedAt: 'updated_at' // automatically creates createdAt and updatedAt
});

module.exports = User;
