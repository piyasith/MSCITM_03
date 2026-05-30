const express = require('express');
const cors = require('cors');
const publicRoutes = require('../routes/public');
const adminRoutes = require('../routes/admin');
const userRoutes = require('../routes/user');

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '5mb' }));
  app.use('/api', publicRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/user', userRoutes);
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Server error' });
  });
  return app;
}

module.exports = createApp;
