const { weightedReviewScore, aggregate } = require('../../utils/scoring');

const defaultWeights = {
  foodQuality: 0.30,
  customerService: 0.20,
  ambienceCleanliness: 0.15,
  valueForMoney: 0.20,
  bookingExperience: 0.10,
  miscellaneous: 0.05
};

const sampleReview = (overrides = {}) => ({
  foodQualityRating: 5,
  customerServiceRating: 4,
  ambienceCleanlinessRating: 4,
  valueForMoneyRating: 3,
  bookingExperienceRating: 4,
  createdAt: new Date(),
  ...overrides
});

describe('scoring utils', () => {
  test('weightedReviewScore applies category weights correctly', () => {
    const score = weightedReviewScore(sampleReview(), defaultWeights);
    const expected =
      (5 * 0.30 + 4 * 0.20 + 4 * 0.15 + 3 * 0.20 + 4 * 0.10) /
      (0.30 + 0.20 + 0.15 + 0.20 + 0.10);
    expect(score).toBeCloseTo(expected, 5);
  });

  test('weightedReviewScore excludes miscellaneous when rating is absent', () => {
    const withMisc = weightedReviewScore(
      sampleReview({ miscellaneousRating: 1 }),
      defaultWeights
    );
    const withoutMisc = weightedReviewScore(sampleReview(), defaultWeights);
    expect(withMisc).toBeLessThan(withoutMisc);
  });

  test('aggregate returns zeros for empty review list', () => {
    const result = aggregate([], { weights: defaultWeights, minReviewCountForRanking: 3 });
    expect(result).toEqual({
      averageRating: 0,
      weightedRating: 0,
      reviewCount: 0,
      eligibleForRanking: false
    });
  });

  test('aggregate marks restaurant ineligible below minimum review count', () => {
    const settings = { weights: defaultWeights, minReviewCountForRanking: 3, recencyHalfLifeDays: 180 };
    const result = aggregate([sampleReview(), sampleReview()], settings);
    expect(result.reviewCount).toBe(2);
    expect(result.eligibleForRanking).toBe(false);
  });

  test('aggregate marks restaurant eligible at minimum review count', () => {
    const settings = { weights: defaultWeights, minReviewCountForRanking: 2, recencyHalfLifeDays: 180 };
    const result = aggregate([sampleReview(), sampleReview()], settings);
    expect(result.eligibleForRanking).toBe(true);
    expect(result.reviewCount).toBe(2);
  });

  test('aggregate weights recent reviews more heavily than old ones', () => {
    const settings = { weights: defaultWeights, minReviewCountForRanking: 1, recencyHalfLifeDays: 30 };
    const oldLow = sampleReview({
      foodQualityRating: 1,
      customerServiceRating: 1,
      ambienceCleanlinessRating: 1,
      valueForMoneyRating: 1,
      bookingExperienceRating: 1,
      createdAt: new Date(Date.now() - 365 * 86400000)
    });
    const recentHigh = sampleReview({
      foodQualityRating: 5,
      customerServiceRating: 5,
      ambienceCleanlinessRating: 5,
      valueForMoneyRating: 5,
      bookingExperienceRating: 5,
      createdAt: new Date()
    });
    const mixed = aggregate([oldLow, recentHigh], settings);
    const allOld = aggregate([oldLow, { ...oldLow, createdAt: new Date(Date.now() - 200 * 86400000) }], settings);
    expect(mixed.weightedRating).toBeGreaterThan(allOld.weightedRating);
  });
});
