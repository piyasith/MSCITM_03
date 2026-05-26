const Review = require('../models/Review');

exports.submitReview = async (req, res) => {
  try {
    const review = new Review({
      ...req.body,
      userId: req.userId,
      status: 'pending'
    });
    await review.save();
    res.status(201).json({ message: 'Review submitted (pending moderation)' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getReviewsByRestaurant = async (req, res) => {
  try {
    const reviews = await Review.find({ restaurantId: req.params.restaurantId, status: 'approved' })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
    const formatted = reviews.map(r => ({
      ...r.toObject(),
      userName: r.userId ? r.userId.name : r.userName
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllReviewsForModeration = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const reviews = await Review.find(filter)
      .populate('restaurantId', 'name')
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.moderateReview = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!review) return res.status(404).json({ message: 'Not found' });
    res.json({ message: `Review ${status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addCompanyResponse = async (req, res) => {
  try {
    const { response } = req.body;
    const review = await Review.findByIdAndUpdate(req.params.id, { companyResponse: response }, { new: true });
    if (!review) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Response added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};