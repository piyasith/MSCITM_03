const mongoose = require('mongoose');

// FR-26 report-content mechanism for community safety
const reportSchema = new mongoose.Schema({
  targetType: { type: String, enum: ['review', 'comment', 'company_response'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reporterUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reporterName: { type: String, default: '' },
  reasonCode: {
    type: String,
    enum: ['spam', 'abuse', 'hate_speech', 'misinformation', 'off_topic', 'personal_info', 'other'],
    required: true
  },
  details: { type: String, default: '' },
  status: {
    type: String,
    enum: ['open', 'reviewed', 'action_taken', 'dismissed'],
    default: 'open'
  },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  resolvedAt: { type: Date, default: null },
  resolution: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('Report', reportSchema);
