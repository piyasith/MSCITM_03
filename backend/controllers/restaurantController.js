const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Review = require('../models/Review');
const CompanyResponse = require('../models/CompanyResponse');
const { getSettings, aggregate } = require('../utils/scoring');

// FR-1 search by name, cuisine, location, price range, dietary tags, rating
exports.getRestaurants = async (req, res) => {
  try {
    const {
      search, cuisine, location, priceRange, dietary, tag, minRating, featured, sort
    } = req.query;

    const filter = { isActive: { $ne: false } };
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (cuisine) {
      filter.$or = [
        { cuisine: { $regex: cuisine, $options: 'i' } },
        { cuisines: { $regex: cuisine, $options: 'i' } }
      ];
    }
    if (location) filter.$and = [{ $or: [
      { address: { $regex: location, $options: 'i' } },
      { location: { $regex: location, $options: 'i' } }
    ] }];
    if (priceRange) filter.priceRange = priceRange;
    if (dietary) {
      const arr = String(dietary).split(',').map(s => s.trim()).filter(Boolean);
      if (arr.length) filter.dietaryTags = { $in: arr };
    }
    if (tag) {
      const arr = String(tag).split(',').map(s => s.trim()).filter(Boolean);
      if (arr.length) filter.tags = { $in: arr };
    }
    if (featured === 'true') filter.isFeatured = true;

    const restaurants = await Restaurant.find(filter).sort({ createdAt: -1 });
    const settings = await getSettings();

    let withRatings = await Promise.all(restaurants.map(async (r) => {
      const reviews = await Review.find({ restaurantId: r._id, status: 'approved' });
      const agg = aggregate(reviews, settings);
      return { ...r.toObject(), ...agg };
    }));

    if (minRating) {
      const m = parseFloat(minRating);
      withRatings = withRatings.filter(x => (x.weightedRating || 0) >= m);
    }

    if (sort === 'rating') withRatings.sort((a, b) => (b.weightedRating || 0) - (a.weightedRating || 0));
    else if (sort === 'reviews') withRatings.sort((a, b) => b.reviewCount - a.reviewCount);

    res.json(withRatings);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Not found' });
    const menu = await MenuItem.find({ restaurantId: restaurant._id, isRetired: { $ne: true } });
    const reviews = await Review.find({ restaurantId: restaurant._id, status: 'approved' }).sort({ createdAt: -1 });

    const reviewIds = reviews.map(r => r._id);
    const responses = await CompanyResponse.find({ reviewId: { $in: reviewIds }, status: 'approved' });
    const responseByReview = {};
    for (const cr of responses) {
      (responseByReview[cr.reviewId] = responseByReview[cr.reviewId] || []).push(cr);
    }
    const reviewsOut = reviews.map(r => ({
      ...r.toObject(),
      companyResponses: responseByReview[r._id] || []
    }));

    const settings = await getSettings();
    const agg = aggregate(reviews, settings);
    res.json({ ...restaurant.toObject(), ...agg, menuItems: menu, reviews: reviewsOut });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// FR-2 search menu items by name and/or category
exports.searchFoodItems = async (req, res) => {
  try {
    const { q, category } = req.query;
    const filter = { isRetired: { $ne: true } };
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (category) filter.category = { $regex: category, $options: 'i' };
    if (!q && !category) return res.json([]);
    const items = await MenuItem.find(filter).populate('restaurantId', 'name image cuisine');
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// FR-18 Top Rated
exports.getTopRated = async (req, res) => {
  try {
    const settings = await getSettings();
    const restaurants = await Restaurant.find({ isActive: { $ne: false } });
    const enriched = await Promise.all(restaurants.map(async (r) => {
      const reviews = await Review.find({ restaurantId: r._id, status: 'approved' });
      const agg = aggregate(reviews, settings);
      return { ...r.toObject(), ...agg };
    }));
    const eligible = enriched.filter(x => x.eligibleForRanking);
    eligible.sort((a, b) => b.weightedRating - a.weightedRating);
    res.json(eligible.slice(0, parseInt(req.query.limit || '10', 10)));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// FR-18 Trending (most approved reviews in trending window)
exports.getTrending = async (req, res) => {
  try {
    const settings = await getSettings();
    const since = new Date(Date.now() - (settings.trendingWindowDays || 30) * 86400000);
    const restaurants = await Restaurant.find({ isActive: { $ne: false } });
    const enriched = await Promise.all(restaurants.map(async (r) => {
      const recentCount = await Review.countDocuments({ restaurantId: r._id, status: 'approved', createdAt: { $gte: since } });
      const allReviews = await Review.find({ restaurantId: r._id, status: 'approved' });
      const agg = aggregate(allReviews, settings);
      return { ...r.toObject(), ...agg, recentReviewCount: recentCount };
    }));
    const trending = enriched
      .filter(x => x.recentReviewCount >= (settings.trendingMinReviews || 1))
      .sort((a, b) => b.recentReviewCount - a.recentReviewCount || b.weightedRating - a.weightedRating);
    res.json(trending.slice(0, parseInt(req.query.limit || '10', 10)));
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

// FR-21 photo management (add, replace, caption/alt, retire)
exports.addPhoto = async (req, res) => {
  try {
    const r = await Restaurant.findById(req.params.id);
    if (!r) return res.status(404).json({ message: 'Not found' });
    r.photos.push({
      url: req.body.url,
      caption: req.body.caption || '',
      altText: req.body.altText || ''
    });
    await r.save();
    res.json(r);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.updatePhoto = async (req, res) => {
  try {
    const r = await Restaurant.findById(req.params.id);
    if (!r) return res.status(404).json({ message: 'Not found' });
    const photo = r.photos.id(req.params.photoId);
    if (!photo) return res.status(404).json({ message: 'Photo not found' });
    if (req.body.url !== undefined) photo.url = req.body.url;
    if (req.body.caption !== undefined) photo.caption = req.body.caption;
    if (req.body.altText !== undefined) photo.altText = req.body.altText;
    if (req.body.isRetired !== undefined) photo.isRetired = req.body.isRetired;
    await r.save();
    res.json(r);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.deletePhoto = async (req, res) => {
  try {
    const r = await Restaurant.findById(req.params.id);
    if (!r) return res.status(404).json({ message: 'Not found' });
    r.photos = r.photos.filter(p => String(p._id) !== req.params.photoId);
    await r.save();
    res.json(r);
  } catch (err) { res.status(400).json({ message: err.message }); }
};
