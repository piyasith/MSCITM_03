const ModerationLog = require('../models/ModerationLog');
const Notification = require('../models/Notification');

// FR-13 record every moderation action for audit
async function logModeration({ targetType, targetId, action, reasonCode = '', reason = '', actorType = 'admin', actorId = null, actorEmail = '', metadata = {} }) {
  try {
    await ModerationLog.create({
      targetType, targetId, action, reasonCode, reason, actorType, actorId, actorEmail, metadata
    });
  } catch (e) {
    console.error('moderation log error', e.message);
  }
}

// FR-24 push a notification to a user
async function notifyUser({ userId, type, title, message, link = '', refType = '', refId = null }) {
  if (!userId) return;
  try {
    await Notification.create({ userId, type, title, message, link, refType, refId });
  } catch (e) {
    console.error('notify error', e.message);
  }
}

const REVIEW_REASON_CODES = ['spam', 'abuse', 'off_topic', 'inappropriate', 'fake', 'personal_info', 'duplicate', 'other'];
const COMMENT_REASON_CODES = REVIEW_REASON_CODES;

module.exports = { logModeration, notifyUser, REVIEW_REASON_CODES, COMMENT_REASON_CODES };
