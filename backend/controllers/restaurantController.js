const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Review = require('../models/Review');

exports.getRestaurants = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = search ? { name: { $regex: search, $options: 'i' } } : {};
    const restaurants = await Restaurant.find(filter).sort({ createdAt: -1 });
    const withRatings = await Promise.all(restaurants.map(async (r) => {
      const reviews = await Review.find({ restaurantId: r._id, status: 'approved' });
      let avg = 0;
      if (reviews.length) {
        avg = reviews.reduce((s, rev) => s + (rev.foodQualityRating + rev.customerServiceRating + rev.miscellaneousRating) / 3, 0) / reviews.length;
      }
      return { ...r.toObject(), averageRating: avg, reviewCount: reviews.length };
    }));
    res.json(withRatings);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Not found' });
    const menu = await MenuItem.find({ restaurantId: restaurant._id });
    const reviews = await Review.find({ restaurantId: restaurant._id, status: 'approved' }).sort({ createdAt: -1 });
    let avg = 0;
    if (reviews.length) {
      avg = reviews.reduce((s, rev) => s + (rev.foodQualityRating + rev.customerServiceRating + rev.miscellaneousRating) / 3, 0) / reviews.length;
    }
    res.json({ ...restaurant.toObject(), averageRating: avg, reviewCount: reviews.length, menuItems: menu, reviews });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.searchFoodItems = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const items = await MenuItem.find({ name: { $regex: q, $options: 'i' } }).populate('restaurantId', 'name image');
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Admin only
exports.createRestaurant = async (req, res) => {
  try {
    const restaurant = new Restaurant(req.body);
    await restaurant.save();
    res.status(201).json(restaurant);
  } catch (err) { res.status(400).json({ message: err.message }); }
};
exports.updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!restaurant) return res.status(404).json({ message: 'Not found' });
    res.json(restaurant);
  } catch (err) { res.status(400).json({ message: err.message }); }
};
exports.deleteRestaurant = async (req, res) => {
  try {
    await Restaurant.findByIdAndDelete(req.params.id);
    await MenuItem.deleteMany({ restaurantId: req.params.id });
    await Review.deleteMany({ restaurantId: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};