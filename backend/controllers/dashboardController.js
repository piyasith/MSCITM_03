const Review = require('../models/Review');
const Comment = require('../models/Comment');
const Restaurant = require('../models/Restaurant');
const Report = require('../models/Report');
const ModerationLog = require('../models/ModerationLog');
const CompanyResponse = require('../models/CompanyResponse');
const User = require('../models/User');

// FR-23 admin reporting dashboards (review volumes, moderation SLA, rating trends)
exports.summary = async (_req, res) => {
  try {
    const [
      totalRestaurants, totalUsers, totalReviews,
      pendingReviews, approvedReviews, rejectedReviews, softRemovedReviews,
      pendingComments, approvedComments, rejectedComments,
      pendingResponses, approvedResponses,
      openReports, escalatedReviews, flaggedUsers
    ] = await Promise.all([
      Restaurant.countDocuments(),
      User.countDocuments(),
      Review.countDocuments(),
      Review.countDocuments({ status: 'pending' }),
      Review.countDocuments({ status: 'approved' }),
      Review.countDocuments({ status: 'rejected' }),
      Review.countDocuments({ status: 'soft_removed' }),
      Comment.countDocuments({ status: 'pending' }),
      Comment.countDocuments({ status: 'approved' }),
      Comment.countDocuments({ status: 'rejected' }),
      CompanyResponse.countDocuments({ status: 'pending' }),
      CompanyResponse.countDocuments({ status: 'approved' }),
      Report.countDocuments({ status: 'open' }),
      Review.countDocuments({ isEscalated: true }),
      User.countDocuments({ isFlagged: true })
    ]);

    // FR-23 moderation SLA (avg minutes between creation and decision over last 30 days)
    const since = new Date(Date.now() - 30 * 86400000);
    const recentDecided = await Review.find({
      moderatedAt: { $ne: null, $gte: since }
    }).select('createdAt moderatedAt').lean();
    let avgMinutes = 0;
    if (recentDecided.length) {
      const totalMs = recentDecided.reduce((s, r) => s + (new Date(r.moderatedAt) - new Date(r.createdAt)), 0);
      avgMinutes = Math.round(totalMs / recentDecided.length / 60000);
    }

    // FR-23 review-volume trend by day (last 14 days)
    const trendStart = new Date(Date.now() - 14 * 86400000);
    const recentReviews = await Review.find({ createdAt: { $gte: trendStart } }).select('createdAt status').lean();
    const trendMap = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      trendMap[d] = { date: d, submitted: 0, approved: 0, rejected: 0 };
    }
    for (const r of recentReviews) {
      const d = new Date(r.createdAt).toISOString().slice(0, 10);
      if (trendMap[d]) trendMap[d].submitted += 1;
      if (trendMap[d] && r.status === 'approved') trendMap[d].approved += 1;
      if (trendMap[d] && r.status === 'rejected') trendMap[d].rejected += 1;
    }

    // FR-23 rating trend (avg overall rating per week, last 8 weeks)
    const ratingTrend = [];
    for (let w = 7; w >= 0; w--) {
      const start = new Date(Date.now() - (w + 1) * 7 * 86400000);
      const end = new Date(Date.now() - w * 7 * 86400000);
      const rs = await Review.find({ status: 'approved', createdAt: { $gte: start, $lt: end } })
        .select('foodQualityRating customerServiceRating ambienceCleanlinessRating valueForMoneyRating bookingExperienceRating')
        .lean();
      let avg = 0;
      if (rs.length) {
        avg = rs.reduce((s, r) => s + (
          (r.foodQualityRating + r.customerServiceRating + r.ambienceCleanlinessRating + r.valueForMoneyRating + r.bookingExperienceRating) / 5
        ), 0) / rs.length;
      }
      ratingTrend.push({ weekStart: start.toISOString().slice(0, 10), avgRating: Number(avg.toFixed(2)), count: rs.length });
    }

    res.json({
      counts: {
        totalRestaurants, totalUsers, totalReviews,
        pendingReviews, approvedReviews, rejectedReviews, softRemovedReviews,
        pendingComments, approvedComments, rejectedComments,
        pendingResponses, approvedResponses,
        openReports, escalatedReviews, flaggedUsers
      },
      moderationSlaMinutes: avgMinutes,
      reviewVolumeTrend: Object.values(trendMap),
      ratingTrend
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// FR-13 view moderation audit trail
exports.auditTrail = async (req, res) => {
  try {
    const { targetType, targetId, limit } = req.query;
    const filter = {};
    if (targetType) filter.targetType = targetType;
    if (targetId) filter.targetId = targetId;
    const logs = await ModerationLog.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit || '100', 10));
    res.json(logs);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
