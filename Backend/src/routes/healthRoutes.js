/**
 * healthRoutes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GET /api/health — simple liveness probe.
 */

const router = require('express').Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mockMode: process.env.MOCK_MODE === 'true',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
