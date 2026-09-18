/**
 * vaultRoutes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GET /api/vault?userId=... — return all VaultItems for a user (newest first)
 */

const router = require('express').Router();
const VaultItem = require('../models/VaultItem');

router.get('/vault', async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: '`userId` query parameter is required.' });
    }

    const items = await VaultItem.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json(items);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
