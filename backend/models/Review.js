const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, lowercase: true },

  // FR-5 structured rating categories
  foodQualityRating: { type: Number, required: true, min: 1, max: 5 },
  customerServiceRating: { type: Number, required: true, min: 1, max: 5 },
  ambienceCleanlinessRating: { type: Number, required: true, min: 1, max: 5 },
  valueForMoneyRating: { type: Number, required: true, min: 1, max: 5 },
  bookingExperienceRating: { type: Number, required: true, min: 1, max: 5 },
  miscellaneousRating: { type: Number, min: 1, max: 5 },
  miscellaneousText: { type: String, default: '' },

  comment: { type: String, required: true },

  // FR-6 optional meal/item association
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', default: null },
  menuItemName: { type: String, default: '' },

  // FR-8 legacy single response (kept for back-compat) - new responses use CompanyResponse
  companyResponse: { type: String, default: '' },

  // FR-10/11/12 moderation lifecycle
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'soft_removed'],
    default: 'pending'
  },
  moderationReason: { type: String, default: '' },
  moderationReasonCode: { type: String, default: '' },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  moderatedAt: { type: Date, default: null },

  // FR-9 re-moderation tracking
  editedAt: { type: Date, default: null },
  editCount: { type: Number, default: 0 },

  // FR-14 escalation/flagging
  reportCount: { type: Number, default: 0 },
  isEscalated: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
