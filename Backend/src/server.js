// ── TLS FIX — must be the very first line ─────────────────────────────────────
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const path = require('path');
const dotenv = require('dotenv');

// Load .env from project root, Backend directory, or process.cwd()
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mindvault';
const MOCK_MODE = process.env.MOCK_MODE === 'true';

function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`🚀  MindVault API  →  http://localhost:${PORT}`);
    console.log(`🔧  MOCK_MODE: ${MOCK_MODE ? 'ON ✅  (Python AI mocked)' : 'OFF — live Python service'}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌  Port ${PORT} already in use. Kill it with:  npx kill-port ${PORT}`);
    } else {
      console.error('❌  Server error:', err.message);
    }
    process.exit(1);
  });
}

// Always connect to MongoDB — it stores users, interests, vault items.
// MOCK_MODE only controls whether the Python AI service is called or mocked.
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    startServer();
  })
  .catch((err) => {
    console.error('⚠️  MongoDB connection warning:', err.message);
    console.log('⚡  Starting server in offline/mock mode...');
    startServer();
  });
