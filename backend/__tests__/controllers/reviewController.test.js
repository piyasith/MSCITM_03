jest.mock('../../models/Review');
jest.mock('../../models/MenuItem');
jest.mock('../../models/Admin');
jest.mock('../../utils/moderation', () => ({
  logModeration: jest.fn().mockResolvedValue(undefined),
  notifyUser: jest.fn().mockResolvedValue(undefined),
  REVIEW_REASON_CODES: ['spam', 'abuse', 'off_topic', 'inappropriate', 'fake', 'personal_info', 'duplicate', 'other']
}));

const Review = require('../../models/Review');
const Admin = require('../../models/Admin');
const reviewController = require('../../controllers/reviewController');
const { mockReq, mockRes } = require('../../test/helpers');
const mongoose = require('mongoose');

describe('reviewController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('listReasonCodes returns allowed reason codes', () => {
    const res = mockRes();
    reviewController.listReasonCodes({}, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining(['spam', 'abuse'])
    );
  });

  test('moderateReview rejects invalid status', async () => {
    const req = mockReq({ body: { status: 'invalid' }, params: { id: 'abc' }, adminId: 'admin1' });
    const res = mockRes();
    await reviewController.moderateReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid status' });
  });

  test('moderateReview requires reasonCode when rejecting', async () => {
    const req = mockReq({ body: { status: 'rejected' }, params: { id: 'abc' }, adminId: 'admin1' });
    const res = mockRes();
    await reviewController.moderateReview(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'reasonCode required for rejection/soft-removal' });
  });

  test('moderateReview approves review and notifies user', async () => {
    const reviewId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    Admin.findById = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ email: 'admin@test.com' }) });
    Review.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: reviewId, userId, status: 'approved' });

    const req = mockReq({
      body: { status: 'approved' },
      params: { id: reviewId.toString() },
      adminId: new mongoose.Types.ObjectId().toString()
    });
    const res = mockRes();
    await reviewController.moderateReview(req, res);

    expect(Review.findByIdAndUpdate).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Review approved' })
    );
  });

  test('deleteMyReview returns 403 when user does not own review', async () => {
    Review.findById = jest.fn().mockResolvedValue({
      _id: 'r1',
      userId: new mongoose.Types.ObjectId()
    });
    const req = mockReq({
      params: { id: 'r1' },
      userId: new mongoose.Types.ObjectId().toString()
    });
    const res = mockRes();
    await reviewController.deleteMyReview(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('editMyReview resets status to pending after edit', async () => {
    const userId = new mongoose.Types.ObjectId();
    const review = {
      _id: new mongoose.Types.ObjectId(),
      userId,
      status: 'approved',
      editCount: 0,
      save: jest.fn().mockResolvedValue(true)
    };
    Review.findById = jest.fn().mockResolvedValue(review);

    const req = mockReq({
      params: { id: review._id.toString() },
      userId: userId.toString(),
      body: { comment: 'Updated text' }
    });
    const res = mockRes();
    await reviewController.editMyReview(req, res);

    expect(review.status).toBe('pending');
    expect(review.editCount).toBe(1);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Review edited; pending re-moderation' })
    );
  });
});
