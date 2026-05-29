const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { logModeration } = require('../utils/moderation');

function issueToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const user = new User({ name, email, password });
    await user.save();
    res.status(201).json({ token: issueToken(user), user: { id: user._id, name, email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.isBanned) return res.status(403).json({ message: 'Account suspended' });
    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    res.json({ token: issueToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role, representsRestaurantId: user.representsRestaurantId } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  const user = await User.findById(req.userId).select('-password');
  res.json(user);
};

// Admin user-moderation endpoints
exports.adminListUsers = async (req, res) => {
  try {
    const { flagged, banned, search } = req.query;
    const filter = {};
    if (flagged === 'true') filter.isFlagged = true;
    if (banned === 'true') filter.isBanned = true;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// FR-14 flag / unflag / ban; promote to company_rep
exports.adminUpdateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    const before = { isFlagged: user.isFlagged, isBanned: user.isBanned, role: user.role };
    ['isFlagged', 'isBanned', 'strikes', 'role', 'representsRestaurantId'].forEach(k => {
      if (req.body[k] !== undefined) user[k] = req.body[k];
    });
    await user.save();
    const actions = [];
    if (before.isFlagged !== user.isFlagged) actions.push(user.isFlagged ? 'flagged' : 'unflagged');
    if (before.isBanned !== user.isBanned) actions.push(user.isBanned ? 'banned' : 'unbanned');
    if (before.role !== user.role) actions.push('edited');
    for (const action of actions) {
      await logModeration({
        targetType: 'user', targetId: user._id, action,
        actorType: 'admin', actorId: req.adminId, reason: req.body.reason || ''
      });
    }
    res.json({ message: 'Updated', user });
  } catch (err) { res.status(400).json({ message: err.message }); }
};
