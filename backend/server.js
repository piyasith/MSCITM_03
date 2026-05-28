const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./utils/db');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const { setupDefaultAdmin } = require('./controllers/adminController');
const Setting = require('./models/Setting');

dotenv.config({ path: require('path').join(__dirname, '.env') });
const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

(async () => {
  await connectDB(process.env.MONGO_URI);
  await setupDefaultAdmin();
  const existing = await Setting.findOne({ key: 'global' });
  if (!existing) await Setting.create({ key: 'global' });
})();

app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
