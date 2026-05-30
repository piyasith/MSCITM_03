jest.mock('../../models/User');
jest.mock('../../utils/moderation', () => ({
  logModeration: jest.fn().mockResolvedValue(undefined)
}));

const User = require('../../models/User');
const userController = require('../../controllers/userController');
const { mockReq, mockRes } = require('../../test/helpers');
const mongoose = require('mongoose');

describe('userController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-jwt-secret';
  });

  test('register returns 400 when email already exists', async () => {
    User.findOne = jest.fn().mockResolvedValue({ email: 'taken@test.com' });
    const req = mockReq({ body: { name: 'Test', email: 'taken@test.com', password: 'pass' } });
    const res = mockRes();
    await userController.register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Email already registered' });
  });

  test('login returns 403 for banned user', async () => {
    User.findOne = jest.fn().mockResolvedValue({
      isBanned: true,
      comparePassword: jest.fn()
    });
    const req = mockReq({ body: { email: 'banned@test.com', password: 'pass' } });
    const res = mockRes();
    await userController.login(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Account suspended' });
  });

  test('login returns 401 for wrong password', async () => {
    User.findOne = jest.fn().mockResolvedValue({
      isBanned: false,
      comparePassword: jest.fn().mockResolvedValue(false)
    });
    const req = mockReq({ body: { email: 'user@test.com', password: 'wrong' } });
    const res = mockRes();
    await userController.login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('adminUpdateUser returns 404 when user not found', async () => {
    User.findById = jest.fn().mockResolvedValue(null);
    const req = mockReq({
      params: { id: new mongoose.Types.ObjectId().toString() },
      adminId: new mongoose.Types.ObjectId().toString(),
      body: { isFlagged: true }
    });
    const res = mockRes();
    await userController.adminUpdateUser(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
