const { User, Report } = require('../models');

async function sendAlarmRequest(MentToUserId, text, recipeId = null, Reporter_id) {
  const user = await User.findByPk(MentToUserId);
  if (!user) throw new Error('User not found');

  const alarm = await Report.create({
    Reporter_id: Reporter_id,
    reported_id: user.id,
    reason: text,
    reported_type: 'alarm' + (recipeId ? `,${recipeId}` : ''),
    status: null,
    created_on: new Date(),
  });

  return alarm;
}

module.exports = { sendAlarmRequest };
