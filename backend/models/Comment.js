const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  commentText: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'soft_removed'],
    default: 'pending'
  },
  moderationReason: { type: String, default: '' },
  moderationReasonCode: { type: String, default: '' },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  moderatedAt: { type: Date, default: null },
  editedAt: { type: Date, default: null },
  editCount: { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 },
  isEscalated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', commentSchema);
