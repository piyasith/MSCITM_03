const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  address: { type: String, required: true },
  image: { type: String, default: 'https://via.placeholder.com/400x300?text=Restaurant' },
  cuisine: { type: String, default: 'Various' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Restaurant', restaurantSchema);