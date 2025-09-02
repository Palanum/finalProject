
const sequelize = require('../db');

async function initDB() {
    try {
        await sequelize.authenticate();
        console.log('Database connected!');

        // Sync all models
        await sequelize.sync({ alter: true });
        console.log('All models synced!');
    } catch (err) {
        console.error('DB initialization error:', err);
        throw err;
    }
}

module.exports = initDB;
