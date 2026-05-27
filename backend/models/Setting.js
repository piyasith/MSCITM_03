const mongoose = require('mongoose');

// FR-16 admin configurable category weights & ranking eligibility
// Single-document settings (key: 'global')
const settingSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true },

  weights: {
    foodQuality: { type: Number, default: 0.30 },
    customerService: { type: Number, default: 0.20 },
    ambienceCleanliness: { type: Number, default: 0.15 },
    valueForMoney: { type: Number, default: 0.20 },
    bookingExperience: { type: Number, default: 0.10 },
    miscellaneous: { type: Number, default: 0.05 }
  },

  minReviewCountForRanking: { type: Number, default: 3 },

  // FR-17 recency weighting (months at which a review is "fresh")
  recencyHalfLifeDays: { type: Number, default: 180 },

  // FR-18 trending threshold (reviews in last N days)
  trendingWindowDays: { type: Number, default: 30 },
  trendingMinReviews: { type: Number, default: 2 },

  // FR-14 auto-escalation
  reportThresholdForEscalation: { type: Number, default: 3 },
  strikeThresholdForFlag: { type: Number, default: 3 },

  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Setting', settingSchema);
