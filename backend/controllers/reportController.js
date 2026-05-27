const Report = require('../models/Report');
const Review = require('../models/Review');
const Comment = require('../models/Comment');
const CompanyResponse = require('../models/CompanyResponse');
const User = require('../models/User');
const { getSettings } = require('../utils/scoring');
const { logModeration } = require('../utils/moderation');

// FR-26 user submits content report
exports.createReport = async (req, res) => {
  try {
    const { targetType, targetId, reasonCode, details } = req.body;
    if (!['review', 'comment', 'company_response'].includes(targetType))
      return res.status(400).json({ message: 'Invalid targetType' });
    if (!targetId || !reasonCode) return res.status(400).json({ message: 'targetId and reasonCode required' });

    const report = await Report.create({
      targetType, targetId, reasonCode,
      details: details || '',
      reporterUserId: req.userId,
      reporterName: req.user?.name || ''
    });

    let updatedTarget = null;
    const Model = targetType === 'review' ? Review : targetType === 'comment' ? Comment : CompanyResponse;
    updatedTarget = await Model.findByIdAndUpdate(targetId, { $inc: { reportCount: 1 } }, { new: true });

    // FR-14 auto-escalate after threshold
    const settings = await getSettings();
    if (updatedTarget && updatedTarget.reportCount >= settings.reportThresholdForEscalation && !updatedTarget.isEscalated) {
      updatedTarget.isEscalated = true;
      await updatedTarget.save();
      await logModeration({
        targetType, targetId,
        action: 'escalated', actorType: 'system',
        reason: `auto-escalation at ${updatedTarget.reportCount} reports`
      });

      // Strike the author and possibly flag them
      const authorId = updatedTarget.userId || updatedTarget.authorId;
      if (authorId) {
        const user = await User.findById(authorId);
        if (user) {
          user.strikes += 1;
          if (user.strikes >= settings.strikeThresholdForFlag) user.isFlagged = true;
          await user.save();
          await logModeration({
            targetType: 'user', targetId: user._id,
            action: user.isFlagged ? 'flagged' : 'escalated',
            actorType: 'system',
            reason: `strike ${user.strikes}`
          });
        }
      }
    }

    res.status(201).json({ message: 'Report submitted', report });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

// FR-26 admin lists / resolves
exports.listReports = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const reports = await Report.find(filter)
      .populate('reporterUserId', 'name email')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getReport = async (req, res) => {
  try {
    const r = await Report.findById(req.params.id).populate('reporterUserId', 'name email');
    if (!r) return res.status(404).json({ message: 'Not found' });
    let content = null;
    if (r.targetType === 'review') content = await Review.findById(r.targetId).populate('userId', 'name email');
    if (r.targetType === 'comment') content = await Comment.findById(r.targetId).populate('userId', 'name email');
    if (r.targetType === 'company_response') content = await CompanyResponse.findById(r.targetId);
    res.json({ report: r, content });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.resolveReport = async (req, res) => {
  try {
    const { status, resolution } = req.body;
    if (!['reviewed', 'action_taken', 'dismissed'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });
    const r = await Report.findByIdAndUpdate(req.params.id, {
      status, resolution: resolution || '',
      resolvedBy: req.adminId, resolvedAt: new Date()
    }, { new: true });
    if (!r) return res.status(404).json({ message: 'Not found' });
    await logModeration({
      targetType: 'report', targetId: r._id,
      action: status === 'dismissed' ? 'unflagged' : 'flagged',
      actorType: 'admin', actorId: req.adminId, reason: resolution || ''
    });
    res.json({ message: 'Report resolved', report: r });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
