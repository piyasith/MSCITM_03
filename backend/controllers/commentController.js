const Comment = require('../models/Comment');

exports.submitComment = async (req, res) => {
  try {
    const comment = new Comment({
      reviewId: req.params.reviewId,
      userId: req.userId,
      commentText: req.body.commentText,
      status: 'pending'
    });
    await comment.save();
    res.status(201).json({ message: 'Comment pending moderation' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getCommentsByReview = async (req, res) => {
  try {
    const comments = await Comment.find({ reviewId: req.params.reviewId, status: 'approved' })
      .populate('userId', 'name')
      .sort({ createdAt: 1 });
    const formatted = comments.map(c => ({
      ...c.toObject(),
      userName: c.userId ? c.userId.name : 'Anonymous'
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllCommentsForModeration = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const comments = await Comment.find(filter)
      .populate('reviewId', 'comment')
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.moderateComment = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const comment = await Comment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!comment) return res.status(404).json({ message: 'Not found' });
    res.json({ message: `Comment ${status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};