const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  caption: { type: String, default: '' },
  altText: { type: String, default: '' },
  isRetired: { type: Boolean, default: false }
}, { _id: true });

const hoursSchema = new mongoose.Schema({
  day: { type: String, enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], required: true },
  open: { type: String, default: '' },
  close: { type: String, default: '' },
  closed: { type: Boolean, default: false }
}, { _id: false });

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  address: { type: String, required: true },
  location: { type: String, default: '' },
  image: { type: String, default: 'https://via.placeholder.com/400x300?text=Restaurant' },
  photos: { type: [photoSchema], default: [] },
  cuisine: { type: String, default: 'Various' },
  cuisines: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  dietaryTags: { type: [String], default: [] },
  priceRange: { type: String, enum: ['$','$$','$$$','$$$$'], default: '$$' },
  openingHours: { type: [hoursSchema], default: [] },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
