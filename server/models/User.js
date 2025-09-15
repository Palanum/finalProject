const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING },
    password_hash: { type: DataTypes.STRING },
    role: { type: DataTypes.ENUM('admin', 'user'), defaultValue: 'user' },
    status: { type: DataTypes.ENUM('normal', 'banned'), defaultValue: 'normal' },
    stat_update: { type: DataTypes.DATE },// to see status changed date
    last_alarm_view: { type: DataTypes.DATE },// to track last alarm view time
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at', // to see registration date
    updatedAt: 'updated_at'
});

module.exports = User;
