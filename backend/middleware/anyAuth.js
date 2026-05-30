const jwt = require('jsonwebtoken');

// Accepts either a user or admin token; sets req.userId or req.adminId accordingly.
module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.adminId) {
      req.adminId = decoded.adminId;
      req.adminRole = decoded.role;
    } else if (decoded.userId) {
      req.userId = decoded.userId;
      req.user = decoded;
    } else {
      return res.status(401).json({ message: 'Invalid token' });
    }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
