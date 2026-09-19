const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const feedRoutes = require('./routes/feedRoutes');
const discoveryRoutes = require('./routes/discoveryRoutes');
const vaultRoutes = require('./routes/vaultRoutes');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');
const reelRoutes = require('./routes/reelRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Core middleware ────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

// ── Static Asset Serving for AI Generated Reels ────────────────────────────────
const generatedReelsPath = path.resolve(__dirname, '../../generated_reels');
app.use('/generated_reels', express.static(generatedReelsPath));

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api', feedRoutes);
app.use('/api', discoveryRoutes);
app.use('/api', vaultRoutes);
app.use('/api', reelRoutes);

// ── 404 catch-all ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ───────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
