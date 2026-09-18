require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mindvault';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected:', MONGO_URI);
    app.listen(PORT, () => {
      console.log(`🚀  MindVault API running on http://localhost:${PORT}`);
      console.log(`🔧  MOCK_MODE: ${process.env.MOCK_MODE === 'true' ? 'ON' : 'OFF'}`);
    });
  })
  .catch((err) => {
    console.error('❌  MongoDB connection error:', err.message);
    process.exit(1);
  });
