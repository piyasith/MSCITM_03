const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, lowercase: true },
  foodQualityRating: { type: Number, required: true, min: 1, max: 5 },
  customerServiceRating: { type: Number, required: true, min: 1, max: 5 },
  miscellaneousRating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  companyResponse: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);