const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

exports.setupDefaultAdmin = async () => {
  const count = await Admin.countDocuments();
  if (count === 0) {
    const admin = new Admin({
      email: 'admin@example.com',
      password: 'admin123',
      fullName: 'Super Admin',
      role: 'super_admin'
    });
    await admin.save();
    console.log('Default super admin created: admin@example.com / admin123');
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email, isActive: true });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await admin.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { adminId: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({ token, admin: { id: admin._id, email: admin.email, fullName: admin.fullName, role: admin.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllAdmins = async (req, res) => {
  const current = await Admin.findById(req.adminId);
  if (current.role !== 'super_admin') return res.status(403).json({ message: 'Forbidden' });
  const admins = await Admin.find().select('-password');
  res.json(admins);
};

exports.createAdmin = async (req, res) => {
  const current = await Admin.findById(req.adminId);
  if (current.role !== 'super_admin') return res.status(403).json({ message: 'Forbidden' });
  const { email, password, fullName, role } = req.body;
  const existing = await Admin.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email exists' });
  const newAdmin = new Admin({ email, password, fullName, role: role || 'admin' });
  await newAdmin.save();
  res.status(201).json({ message: 'Admin created', admin: { id: newAdmin._id, email, fullName, role: newAdmin.role } });
};

exports.updateAdmin = async (req, res) => {
  const current = await Admin.findById(req.adminId);
  if (current.role !== 'super_admin') return res.status(403).json({ message: 'Forbidden' });
  const admin = await Admin.findById(req.params.id);
  if (!admin) return res.status(404).json({ message: 'Not found' });
  if (req.params.id === req.adminId && (req.body.role === 'admin' || req.body.isActive === false))
    return res.status(400).json({ message: 'Cannot demote/disable yourself' });
  if (req.body.fullName !== undefined) admin.fullName = req.body.fullName;
  if (req.body.role !== undefined) admin.role = req.body.role;
  if (req.body.isActive !== undefined) admin.isActive = req.body.isActive;
  if (req.body.password) admin.password = req.body.password;
  await admin.save();
  res.json({ message: 'Admin updated' });
};

exports.deleteAdmin = async (req, res) => {
  const current = await Admin.findById(req.adminId);
  if (current.role !== 'super_admin') return res.status(403).json({ message: 'Forbidden' });
  if (req.params.id === req.adminId) return res.status(400).json({ message: 'Cannot delete self' });
  await Admin.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
};

exports.changeOwnPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const admin = await Admin.findById(req.adminId);
  const match = await admin.comparePassword(currentPassword);
  if (!match) return res.status(401).json({ message: 'Wrong password' });
  admin.password = newPassword;
  await admin.save();
  res.json({ message: 'Password changed' });
};

exports.getCurrentAdmin = async (req, res) => {
  const admin = await Admin.findById(req.adminId).select('-password');
  res.json(admin);
};