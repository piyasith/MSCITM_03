const Review = require('../models/Review');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const Admin = require('../models/Admin');
const { logModeration, notifyUser, REVIEW_REASON_CODES } = require('../utils/moderation');

exports.submitReview = async (req, res) => {
  try {
    let menuItemName = '';
    if (req.body.menuItemId) {
      const mi = await MenuItem.findById(req.body.menuItemId);
      if (mi) menuItemName = mi.name;
    }
    const review = new Review({
      ...req.body,
      menuItemName,
      userId: req.userId,
      status: 'pending'
    });
    await review.save();
    await logModeration({
      targetType: 'review', targetId: review._id, action: 'created',
      actorType: 'user', actorId: req.userId, actorEmail: req.user?.email || ''
    });
    res.status(201).json({ message: 'Review submitted (pending moderation)', review });
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

// FR-25 user-facing list of own submissions with status
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.userId })
      .populate('restaurantId', 'name image')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// FR-9 edit own review; triggers re-moderation
exports.editMyReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Not found' });
    if (String(review.userId) !== String(req.userId)) return res.status(403).json({ message: 'Forbidden' });

    const editableFields = [
      'foodQualityRating','customerServiceRating','ambienceCleanlinessRating',
      'valueForMoneyRating','bookingExperienceRating','miscellaneousRating',
      'miscellaneousText','comment','menuItemId'
    ];
    for (const f of editableFields) {
      if (req.body[f] !== undefined) review[f] = req.body[f];
    }
    if (req.body.menuItemId) {
      const mi = await MenuItem.findById(req.body.menuItemId);
      review.menuItemName = mi ? mi.name : '';
    } else if (req.body.menuItemId === null) {
      review.menuItemName = '';
    }
    review.editedAt = new Date();
    review.editCount += 1;

    const wasApproved = review.status === 'approved';
    review.status = 'pending';
    review.moderatedAt = null;
    review.moderatedBy = null;
    review.moderationReason = '';
    review.moderationReasonCode = '';

    await review.save();
    await logModeration({
      targetType: 'review', targetId: review._id,
      action: 'edited', actorType: 'user', actorId: req.userId,
      metadata: { wasApproved }
    });
    await notifyUser({
      userId: req.userId,
      type: 'review_remoderation',
      title: 'Review re-submitted for moderation',
      message: 'Your edited review will be reviewed again before becoming public.',
      refType: 'review', refId: review._id
    });
    res.json({ message: 'Review edited; pending re-moderation', review });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

// FR-9 delete own (only if not yet moderated, unless soft-remove desired)
exports.deleteMyReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Not found' });
    if (String(review.userId) !== String(req.userId)) return res.status(403).json({ message: 'Forbidden' });
    await Review.findByIdAndDelete(req.params.id);
    await logModeration({
      targetType: 'review', targetId: review._id,
      action: 'soft_removed', actorType: 'user', actorId: req.userId,
      reason: 'user_deleted'
    });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getAllReviewsForModeration = async (req, res) => {
  try {
    const { status, escalated } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (escalated === 'true') filter.isEscalated = true;
    const reviews = await Review.find(filter)
      .populate('restaurantId', 'name')
      .populate('userId', 'name email strikes isFlagged')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// FR-11 approve/reject/soft-remove with reason codes & FR-13 audit & FR-24 notify
exports.moderateReview = async (req, res) => {
  try {
    const { status, reasonCode, reason } = req.body;
    const allowed = ['approved', 'rejected', 'soft_removed'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    if ((status === 'rejected' || status === 'soft_removed') && !reasonCode) {
      return res.status(400).json({ message: 'reasonCode required for rejection/soft-removal' });
    }
    if (reasonCode && !REVIEW_REASON_CODES.includes(reasonCode)) {
      return res.status(400).json({ message: 'Invalid reasonCode' });
    }
    const admin = await Admin.findById(req.adminId).select('email');
    const review = await Review.findByIdAndUpdate(req.params.id, {
      status,
      moderationReasonCode: reasonCode || '',
      moderationReason: reason || '',
      moderatedBy: req.adminId,
      moderatedAt: new Date()
    }, { new: true });
    if (!review) return res.status(404).json({ message: 'Not found' });

    await logModeration({
      targetType: 'review', targetId: review._id,
      action: status, reasonCode: reasonCode || '', reason: reason || '',
      actorType: 'admin', actorId: req.adminId, actorEmail: admin?.email || ''
    });

    const typeMap = {
      approved: { t: 'review_approved', title: 'Your review was approved', msg: 'It is now publicly visible.' },
      rejected: { t: 'review_rejected', title: 'Your review was rejected', msg: `Reason: ${reasonCode}${reason ? ' - ' + reason : ''}` },
      soft_removed: { t: 'review_soft_removed', title: 'Your review was removed', msg: `Reason: ${reasonCode}${reason ? ' - ' + reason : ''}` }
    };
    const n = typeMap[status];
    await notifyUser({
      userId: review.userId, type: n.t,
      title: n.title, message: n.msg,
      refType: 'review', refId: review._id
    });

    res.json({ message: `Review ${status}`, review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// FR-14 mark review as escalated
exports.escalateReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { isEscalated: true }, { new: true });
    if (!review) return res.status(404).json({ message: 'Not found' });
    await logModeration({
      targetType: 'review', targetId: review._id, action: 'escalated',
      actorType: 'admin', actorId: req.adminId, reason: req.body.reason || ''
    });
    res.json({ message: 'Escalated', review });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.listReasonCodes = (_req, res) => res.json(REVIEW_REASON_CODES);
