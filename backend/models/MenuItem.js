const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: 'https://via.placeholder.com/300x200?text=Meal' },
  category: { type: String, default: 'Main Course' }
});

module.exports = mongoose.model('MenuItem', menuItemSchema);