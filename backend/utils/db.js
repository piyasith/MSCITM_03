const mongoose = require('mongoose');

const connectDB = async (uri) => {
  if (!uri) {
    console.error('Error: MONGO_URI is not set. Copy backend/.env.example to backend/.env and add your Atlas connection string.');
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host} (db: ${conn.connection.name})`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;