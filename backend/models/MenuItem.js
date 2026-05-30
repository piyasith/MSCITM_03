const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: 'https://via.placeholder.com/300x200?text=Meal' },
  imageCaption: { type: String, default: '' },
  imageAlt: { type: String, default: '' },
  category: { type: String, default: 'Main Course' },
  dietaryTags: { type: [String], default: [] },
  isAvailable: { type: Boolean, default: true },
  isRetired: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});

menuItemSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});
menuItemSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
