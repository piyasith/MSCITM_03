const auth = require('../../middleware/auth');
const userAuth = require('../../middleware/userAuth');
const anyAuth = require('../../middleware/anyAuth');
const { mockReq, mockRes, signUserToken, signAdminToken } = require('../../test/helpers');

describe('auth middleware', () => {
  test('auth returns 401 when Authorization header is missing', () => {
    const req = mockReq({ header: jest.fn().mockReturnValue(undefined) });
    const res = mockRes();
    const next = jest.fn();
    auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('auth calls next and sets adminId for valid admin token', () => {
    const adminId = '507f1f77bcf86cd799439011';
    const token = signAdminToken({ adminId, role: 'super_admin' });
    const req = mockReq({ header: jest.fn().mockReturnValue(`Bearer ${token}`) });
    const res = mockRes();
    const next = jest.fn();
    auth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.adminId).toBe(adminId);
    expect(req.adminRole).toBe('super_admin');
  });

  test('userAuth returns 401 for invalid token', () => {
    const req = mockReq({ header: jest.fn().mockReturnValue('Bearer not-a-valid-jwt') });
    const res = mockRes();
    const next = jest.fn();
    userAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
  });

  test('anyAuth accepts user token and sets userId', () => {
    const userId = '507f1f77bcf86cd799439012';
    const token = signUserToken({ userId });
    const req = mockReq({ header: jest.fn().mockReturnValue(`Bearer ${token}`) });
    const res = mockRes();
    const next = jest.fn();
    anyAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe(userId);
  });
});
