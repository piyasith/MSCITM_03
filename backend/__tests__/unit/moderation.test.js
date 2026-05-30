jest.mock('../../models/ModerationLog', () => ({
  create: jest.fn().mockResolvedValue({})
}));

jest.mock('../../models/Notification', () => ({
  create: jest.fn().mockResolvedValue({})
}));

const ModerationLog = require('../../models/ModerationLog');
const Notification = require('../../models/Notification');
const {
  logModeration,
  notifyUser,
  REVIEW_REASON_CODES,
  COMMENT_REASON_CODES
} = require('../../utils/moderation');
const mongoose = require('mongoose');

describe('moderation utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('REVIEW_REASON_CODES includes expected policy codes', () => {
    expect(REVIEW_REASON_CODES).toEqual(
      expect.arrayContaining(['spam', 'abuse', 'off_topic', 'inappropriate'])
    );
    expect(COMMENT_REASON_CODES).toEqual(REVIEW_REASON_CODES);
  });

  test('logModeration persists audit record with actor and action', async () => {
    const targetId = new mongoose.Types.ObjectId();
    await logModeration({
      targetType: 'review',
      targetId,
      action: 'approved',
      reasonCode: 'spam',
      reason: 'test note',
      actorType: 'admin',
      actorId: new mongoose.Types.ObjectId(),
      actorEmail: 'mod@test.com'
    });
    expect(ModerationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: 'review',
        targetId,
        action: 'approved',
        reasonCode: 'spam',
        actorEmail: 'mod@test.com'
      })
    );
  });

  test('notifyUser creates in-app notification for user', async () => {
    const userId = new mongoose.Types.ObjectId();
    await notifyUser({
      userId,
      type: 'review_approved',
      title: 'Approved',
      message: 'Your review is live',
      refType: 'review',
      refId: new mongoose.Types.ObjectId()
    });
    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        type: 'review_approved',
        title: 'Approved'
      })
    );
  });

  test('notifyUser skips when userId is missing', async () => {
    await notifyUser({ type: 'system', title: 'x', message: 'y' });
    expect(Notification.create).not.toHaveBeenCalled();
  });
});
