const Comment = require('../models/Comment');
const Admin = require('../models/Admin');
const { logModeration, notifyUser, COMMENT_REASON_CODES } = require('../utils/moderation');

exports.submitComment = async (req, res) => {
  try {
    const comment = new Comment({
      reviewId: req.params.reviewId,
      userId: req.userId,
      commentText: req.body.commentText,
      status: 'pending'
    });
    await comment.save();
    await logModeration({
      targetType: 'comment', targetId: comment._id, action: 'created',
      actorType: 'user', actorId: req.userId
    });
    res.status(201).json({ message: 'Comment pending moderation', comment });
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

exports.getMyComments = async (req, res) => {
  try {
    const comments = await Comment.find({ userId: req.userId })
      .populate('reviewId', 'comment restaurantId')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// FR-9 edit own comment, re-moderation
exports.editMyComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Not found' });
    if (String(comment.userId) !== String(req.userId)) return res.status(403).json({ message: 'Forbidden' });
    comment.commentText = req.body.commentText || comment.commentText;
    comment.editedAt = new Date();
    comment.editCount += 1;
    comment.status = 'pending';
    comment.moderatedAt = null;
    comment.moderatedBy = null;
    comment.moderationReason = '';
    comment.moderationReasonCode = '';
    await comment.save();
    await logModeration({
      targetType: 'comment', targetId: comment._id, action: 'edited',
      actorType: 'user', actorId: req.userId
    });
    await notifyUser({
      userId: req.userId, type: 'comment_remoderation',
      title: 'Comment re-submitted for moderation',
      message: 'Your edited comment will be reviewed again before becoming public.',
      refType: 'comment', refId: comment._id
    });
    res.json({ message: 'Comment edited; pending re-moderation', comment });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.deleteMyComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Not found' });
    if (String(comment.userId) !== String(req.userId)) return res.status(403).json({ message: 'Forbidden' });
    await Comment.findByIdAndDelete(req.params.id);
    await logModeration({
      targetType: 'comment', targetId: comment._id, action: 'soft_removed',
      actorType: 'user', actorId: req.userId, reason: 'user_deleted'
    });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getAllCommentsForModeration = async (req, res) => {
  try {
    const { status, escalated } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (escalated === 'true') filter.isEscalated = true;
    const comments = await Comment.find(filter)
      .populate('reviewId', 'comment')
      .populate('userId', 'name email strikes isFlagged')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.moderateComment = async (req, res) => {
  try {
    const { status, reasonCode, reason } = req.body;
    const allowed = ['approved', 'rejected', 'soft_removed'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    if ((status === 'rejected' || status === 'soft_removed') && !reasonCode) {
      return res.status(400).json({ message: 'reasonCode required' });
    }
    if (reasonCode && !COMMENT_REASON_CODES.includes(reasonCode)) {
      return res.status(400).json({ message: 'Invalid reasonCode' });
    }
    const admin = await Admin.findById(req.adminId).select('email');
    const comment = await Comment.findByIdAndUpdate(req.params.id, {
      status,
      moderationReasonCode: reasonCode || '',
      moderationReason: reason || '',
      moderatedBy: req.adminId,
      moderatedAt: new Date()
    }, { new: true });
    if (!comment) return res.status(404).json({ message: 'Not found' });

    await logModeration({
      targetType: 'comment', targetId: comment._id,
      action: status, reasonCode: reasonCode || '', reason: reason || '',
      actorType: 'admin', actorId: req.adminId, actorEmail: admin?.email || ''
    });

    const typeMap = {
      approved: { t: 'comment_approved', title: 'Your comment was approved', msg: 'It is now publicly visible.' },
      rejected: { t: 'comment_rejected', title: 'Your comment was rejected', msg: `Reason: ${reasonCode}${reason ? ' - ' + reason : ''}` },
      soft_removed: { t: 'comment_soft_removed', title: 'Your comment was removed', msg: `Reason: ${reasonCode}${reason ? ' - ' + reason : ''}` }
    };
    const n = typeMap[status];
    await notifyUser({
      userId: comment.userId, type: n.t,
      title: n.title, message: n.msg,
      refType: 'comment', refId: comment._id
    });

    res.json({ message: `Comment ${status}`, comment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.escalateComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(req.params.id, { isEscalated: true }, { new: true });
    if (!comment) return res.status(404).json({ message: 'Not found' });
    await logModeration({
      targetType: 'comment', targetId: comment._id, action: 'escalated',
      actorType: 'admin', actorId: req.adminId, reason: req.body.reason || ''
    });
    res.json({ message: 'Escalated', comment });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.listReasonCodes = (_req, res) => res.json(COMMENT_REASON_CODES);
