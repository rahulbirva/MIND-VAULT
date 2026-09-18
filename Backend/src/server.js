require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mindvault';

mongoose
  .connect(MONGO_URI, {
    // Required for Atlas on Node 24 (OpenSSL 3 strict TLS policy)
    tlsAllowInvalidCertificates: MONGO_URI.includes('mongodb+srv'),
  })
  .then(() => {
    console.log('✅  MongoDB connected')
    app.listen(PORT, () => {
      console.log(`🚀  MindVault API running on http://localhost:${PORT}`)
      console.log(`🔧  MOCK_MODE: ${process.env.MOCK_MODE === 'true' ? 'ON' : 'OFF'}`)
    })
  })
  .catch((err) => {
    console.error('❌  MongoDB connection error:', err.message);
    process.exit(1);
  });
