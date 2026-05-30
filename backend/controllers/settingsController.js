const Setting = require('../models/Setting');
const { invalidateSettings } = require('../utils/scoring');

// FR-16 admin reads / writes global ranking settings
exports.getSettings = async (_req, res) => {
  try {
    let s = await Setting.findOne({ key: 'global' });
    if (!s) s = await Setting.create({ key: 'global' });
    res.json(s);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateSettings = async (req, res) => {
  try {
    const body = req.body || {};
    let s = await Setting.findOne({ key: 'global' });
    if (!s) s = await Setting.create({ key: 'global' });
    if (body.weights) {
      const w = body.weights;
      ['foodQuality','customerService','ambienceCleanliness','valueForMoney','bookingExperience','miscellaneous'].forEach(k => {
        if (w[k] !== undefined) s.weights[k] = Number(w[k]);
      });
    }
    ['minReviewCountForRanking','recencyHalfLifeDays','trendingWindowDays','trendingMinReviews','reportThresholdForEscalation','strikeThresholdForFlag'].forEach(k => {
      if (body[k] !== undefined) s[k] = Number(body[k]);
    });
    s.updatedAt = new Date();
    await s.save();
    invalidateSettings();
    res.json(s);
  } catch (err) { res.status(400).json({ message: err.message }); }
};
