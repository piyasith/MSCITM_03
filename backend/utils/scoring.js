const Setting = require('../models/Setting');
const Review = require('../models/Review');

let cachedSettings = null;
let cachedAt = 0;
const TTL_MS = 30 * 1000;

async function getSettings() {
  const now = Date.now();
  if (cachedSettings && now - cachedAt < TTL_MS) return cachedSettings;
  let s = await Setting.findOne({ key: 'global' });
  if (!s) s = await Setting.create({ key: 'global' });
  cachedSettings = s.toObject();
  cachedAt = now;
  return cachedSettings;
}

function invalidateSettings() {
  cachedSettings = null;
  cachedAt = 0;
}

// FR-15 weighted category rating per review
function weightedReviewScore(review, weights) {
  const w = weights;
  const parts = [
    { v: review.foodQualityRating, w: w.foodQuality },
    { v: review.customerServiceRating, w: w.customerService },
    { v: review.ambienceCleanlinessRating, w: w.ambienceCleanliness },
    { v: review.valueForMoneyRating, w: w.valueForMoney },
    { v: review.bookingExperienceRating, w: w.bookingExperience },
    { v: review.miscellaneousRating || 0, w: review.miscellaneousRating ? w.miscellaneous : 0 }
  ];
  let total = 0;
  let wSum = 0;
  for (const p of parts) {
    if (p.v && p.w) {
      total += p.v * p.w;
      wSum += p.w;
    }
  }
  return wSum ? total / wSum : 0;
}

// FR-17 recency-weighted aggregate (exponential decay)
function aggregate(reviews, settings) {
  if (!reviews || reviews.length === 0) return { averageRating: 0, weightedRating: 0, reviewCount: 0, eligibleForRanking: false };
  const halfLife = settings.recencyHalfLifeDays || 180;
  const now = Date.now();
  let numerator = 0;
  let denominator = 0;
  let plainSum = 0;
  for (const r of reviews) {
    const ageDays = (now - new Date(r.createdAt).getTime()) / 86400000;
    const recencyWeight = Math.pow(0.5, ageDays / halfLife);
    const score = weightedReviewScore(r, settings.weights);
    numerator += score * recencyWeight;
    denominator += recencyWeight;
    plainSum += score;
  }
  const weighted = denominator ? numerator / denominator : 0;
  const avg = plainSum / reviews.length;
  return {
    averageRating: avg,
    weightedRating: weighted,
    reviewCount: reviews.length,
    eligibleForRanking: reviews.length >= (settings.minReviewCountForRanking || 0)
  };
}

async function computeRestaurantScore(restaurantId) {
  const settings = await getSettings();
  const reviews = await Review.find({ restaurantId, status: 'approved' });
  return aggregate(reviews, settings);
}

module.exports = {
  getSettings,
  invalidateSettings,
  weightedReviewScore,
  aggregate,
  computeRestaurantScore
};
