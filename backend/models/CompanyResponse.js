const mongoose = require('mongoose');

// FR-8 / FR-10 company representative responses, themselves moderated
const companyResponseSchema = new mongoose.Schema({
  reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  authorType: { type: String, enum: ['admin', 'company_rep'], required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  authorName: { type: String, default: '' },
  text: { type: String, required: true },
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
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CompanyResponse', companyResponseSchema);
