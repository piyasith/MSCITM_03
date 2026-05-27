const mongoose = require('mongoose');

// FR-24 / FR-25 user notifications for moderation decisions and submission status
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['review_approved', 'review_rejected', 'review_soft_removed', 'review_remoderation',
           'comment_approved', 'comment_rejected', 'comment_soft_removed', 'comment_remoderation',
           'report_resolved', 'company_response', 'system'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: '' },
  refType: { type: String, default: '' },
  refId: { type: mongoose.Schema.Types.ObjectId, default: null },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
