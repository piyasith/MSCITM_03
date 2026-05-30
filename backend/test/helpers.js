const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    header: jest.fn(),
    ...overrides
  };
}

function signUserToken(payload = {}) {
  return jwt.sign(
    { userId: payload.userId || new mongoose.Types.ObjectId().toString(), email: 'user@test.com', name: 'Test User', ...payload },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function signAdminToken(payload = {}) {
  return jwt.sign(
    { adminId: payload.adminId || new mongoose.Types.ObjectId().toString(), email: 'admin@test.com', role: 'admin', ...payload },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

module.exports = { mockRes, mockReq, signUserToken, signAdminToken };
