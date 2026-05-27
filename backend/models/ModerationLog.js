const mongoose = require('mongoose');

// FR-13 moderation audit trail (actor, timestamp, action, reason)
const moderationLogSchema = new mongoose.Schema({
  targetType: { type: String, enum: ['review', 'comment', 'company_response', 'report', 'user'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  action: {
    type: String,
    enum: ['approved', 'rejected', 'soft_removed', 'restored', 'edited', 'created', 'escalated', 'flagged', 'unflagged', 'banned', 'unbanned'],
    required: true
  },
  reasonCode: { type: String, default: '' },
  reason: { type: String, default: '' },
  actorType: { type: String, enum: ['admin', 'system', 'user'], default: 'admin' },
  actorId: { type: mongoose.Schema.Types.ObjectId, default: null },
  actorEmail: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

moderationLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

module.exports = mongoose.model('ModerationLog', moderationLogSchema);
