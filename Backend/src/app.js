const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const feedRoutes = require('./routes/feedRoutes');
const discoveryRoutes = require('./routes/discoveryRoutes');
const deepDiveRoutes = require('./routes/deepDiveRoutes');
const vaultRoutes = require('./routes/vaultRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');
const learnFeedRoutes = require('./routes/learnFeedRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Core middleware ────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api', feedRoutes);
app.use('/api', discoveryRoutes);
app.use('/api', deepDiveRoutes);
app.use('/api', vaultRoutes);
app.use('/api/learnfeed', learnFeedRoutes);

// ── 404 catch-all ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ───────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
