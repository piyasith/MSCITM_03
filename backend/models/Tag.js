const mongoose = require('mongoose');

// FR-22 admin-managed cuisines / tags / categories
const tagSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['cuisine', 'dietary', 'feature', 'category'], required: true },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

tagSchema.index({ name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Tag', tagSchema);
