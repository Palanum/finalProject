const { User } = require('../models');
const { sendAlarmRequest } = require('../utils/alarmUser');

async function autoUnban(req, res, next) {
    if (!req.session?.user) return next();

    try {
        const user = await User.findByPk(req.session.user.id);
        if (user && user.status === 'banned' && user.stat_update <= new Date()) {
            console.log(`Auto-unbanning user ID ${user.id}`);
            user.status = 'normal';
            user.stat_update = new Date();
            await user.save();

            // Optional: notify user via alarm
            await sendAlarmRequest(user.id, 'การระงับการใช้งานถูกปลดแล้ว');
        }
    } catch (err) {
        console.error('Error in auto-unban middleware:', err);
    }

    next();
}

module.exports = autoUnban;