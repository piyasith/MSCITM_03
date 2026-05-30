const Tag = require('../models/Tag');

// FR-22 admin manages categories/tags/cuisines & feature visibility
exports.publicList = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;
    const tags = await Tag.find(filter).sort({ isFeatured: -1, name: 1 });
    res.json(tags);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.adminList = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type) filter.type = type;
    const tags = await Tag.find(filter).sort({ type: 1, name: 1 });
    res.json(tags);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const tag = await Tag.create(req.body);
    res.status(201).json(tag);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const tag = await Tag.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tag) return res.status(404).json({ message: 'Not found' });
    res.json(tag);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await Tag.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
