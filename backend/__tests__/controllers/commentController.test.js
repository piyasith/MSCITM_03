jest.mock('../../models/Comment');
jest.mock('../../utils/moderation', () => ({
  logModeration: jest.fn().mockResolvedValue(undefined),
  notifyUser: jest.fn().mockResolvedValue(undefined),
  COMMENT_REASON_CODES: ['spam', 'abuse']
}));

const Comment = require('../../models/Comment');
const commentController = require('../../controllers/commentController');
const { mockReq, mockRes } = require('../../test/helpers');
const mongoose = require('mongoose');

describe('commentController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('submitComment creates pending comment', async () => {
    const saved = {
      _id: new mongoose.Types.ObjectId(),
      status: 'pending',
      commentText: 'Agreed!'
    };
    Comment.mockImplementation(() => ({
      ...saved,
      save: jest.fn().mockResolvedValue(saved)
    }));

    const reviewId = new mongoose.Types.ObjectId().toString();
    const req = mockReq({
      params: { reviewId },
      userId: new mongoose.Types.ObjectId().toString(),
      body: { commentText: 'Agreed!' }
    });
    const res = mockRes();
    await commentController.submitComment(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Comment pending moderation' })
    );
  });

  test('editMyComment returns 403 for non-owner', async () => {
    Comment.findById = jest.fn().mockResolvedValue({
      userId: new mongoose.Types.ObjectId()
    });
    const req = mockReq({
      params: { id: 'c1' },
      userId: new mongoose.Types.ObjectId().toString(),
      body: { commentText: 'Edited' }
    });
    const res = mockRes();
    await commentController.editMyComment(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
