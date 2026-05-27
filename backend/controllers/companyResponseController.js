const CompanyResponse = require('../models/CompanyResponse');
const Review = require('../models/Review');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { logModeration, notifyUser, REVIEW_REASON_CODES } = require('../utils/moderation');

// FR-8 company rep / admin creates a response - enters moderation queue (FR-10)
exports.submitResponse = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    let authorType, authorId, authorName;
    if (req.adminId) {
      const admin = await Admin.findById(req.adminId);
      authorType = 'admin';
      authorId = req.adminId;
      authorName = admin.fullName || admin.email;
    } else if (req.userId) {
      const user = await User.findById(req.userId);
      if (!user || user.role !== 'company_rep') return res.status(403).json({ message: 'Company rep role required' });
      if (String(user.representsRestaurantId) !== String(review.restaurantId)) {
        return res.status(403).json({ message: 'Not your restaurant' });
      }
      authorType = 'company_rep';
      authorId = req.userId;
      authorName = user.name;
    } else {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const resp = await CompanyResponse.create({
      reviewId: review._id,
      restaurantId: review.restaurantId,
      authorType, authorId, authorName,
      text: req.body.text,
      status: 'pending'
    });
    await logModeration({
      targetType: 'company_response', targetId: resp._id, action: 'created',
      actorType: authorType === 'admin' ? 'admin' : 'user', actorId: authorId
    });
    res.status(201).json({ message: 'Response submitted, pending moderation', response: resp });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.getResponsesByReview = async (req, res) => {
  try {
    const items = await CompanyResponse.find({ reviewId: req.params.reviewId, status: 'approved' }).sort({ createdAt: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.editResponse = async (req, res) => {
  try {
    const resp = await CompanyResponse.findById(req.params.id);
    if (!resp) return res.status(404).json({ message: 'Not found' });
    const isOwner = (req.adminId && resp.authorType === 'admin' && String(resp.authorId) === String(req.adminId)) ||
                    (req.userId && resp.authorType === 'company_rep' && String(resp.authorId) === String(req.userId));
    if (!isOwner) return res.status(403).json({ message: 'Forbidden' });
    resp.text = req.body.text || resp.text;
    resp.editedAt = new Date();
    resp.editCount += 1;
    resp.status = 'pending';
    resp.moderatedAt = null;
    resp.moderatedBy = null;
    await resp.save();
    await logModeration({ targetType: 'company_response', targetId: resp._id, action: 'edited', actorType: resp.authorType === 'admin' ? 'admin' : 'user', actorId: resp.authorId });
    res.json({ message: 'Edited; pending re-moderation', response: resp });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.getAllForModeration = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const items = await CompanyResponse.find(filter).populate('reviewId', 'comment restaurantId').sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.moderate = async (req, res) => {
  try {
    const { status, reasonCode, reason } = req.body;
    if (!['approved', 'rejected', 'soft_removed'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    if ((status === 'rejected' || status === 'soft_removed') && !reasonCode) return res.status(400).json({ message: 'reasonCode required' });
    if (reasonCode && !REVIEW_REASON_CODES.includes(reasonCode)) return res.status(400).json({ message: 'Invalid reasonCode' });
    const admin = await Admin.findById(req.adminId).select('email');
    const resp = await CompanyResponse.findByIdAndUpdate(req.params.id, {
      status,
      moderationReasonCode: reasonCode || '',
      moderationReason: reason || '',
      moderatedBy: req.adminId,
      moderatedAt: new Date()
    }, { new: true });
    if (!resp) return res.status(404).json({ message: 'Not found' });
    await logModeration({
      targetType: 'company_response', targetId: resp._id,
      action: status, reasonCode: reasonCode || '', reason: reason || '',
      actorType: 'admin', actorId: req.adminId, actorEmail: admin?.email || ''
    });
    if (resp.authorType === 'company_rep') {
      await notifyUser({
        userId: resp.authorId,
        type: status === 'approved' ? 'company_response' : 'system',
        title: `Your company response was ${status}`,
        message: status === 'approved' ? 'Your response is now public.' : `Reason: ${reasonCode || ''}${reason ? ' - ' + reason : ''}`,
        refType: 'company_response', refId: resp._id
      });
    }
    res.json({ message: `Response ${status}`, response: resp });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
