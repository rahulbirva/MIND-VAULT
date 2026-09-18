/**
 * feedRoutes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GET  /api/feed?userId=...          — personalised interest feed
 * POST /api/feed/:id/save            — copy a FeedItem → VaultItem (sourceType "saved")
 */

const router = require('express').Router();
const User = require('../models/User');
const FeedItem = require('../models/FeedItem');
const VaultItem = require('../models/VaultItem');
const pythonService = require('../services/pythonService');

// ── GET /api/feed ─────────────────────────────────────────────────────────────

router.get('/feed', async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: '`userId` query parameter is required.' });
    }

    // 1. Fetch user's interests from Mongo
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: `User ${userId} not found.` });
    }

    if (!user.interests || user.interests.length === 0) {
      return res.status(400).json({
        error: 'User has no interests set. Call POST /api/user/interests first.',
      });
    }

    // 2. Call Python service to simplify those topics
    const items = await pythonService.simplify(user.interests);

    // 3. Persist each item as a FeedItem (source = "interest")
    const saved = await Promise.all(
      items.map((item) =>
        FeedItem.create({
          userId,
          topic: item.topic,
          summary: item.summary,
          keyPoints: item.keyPoints || [],
          videoUrl: item.videoUrl || null,
          source: 'interest',
        })
      )
    );

    return res.status(200).json(saved);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/feed/:id/save ───────────────────────────────────────────────────

router.post('/feed/:id/save', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: '`userId` is required in the request body.' });
    }

    const feedItem = await FeedItem.findById(id);
    if (!feedItem) {
      return res.status(404).json({ error: `FeedItem ${id} not found.` });
    }

    // Copy into VaultItem
    const vaultItem = await VaultItem.create({
      userId,
      topic: feedItem.topic,
      summary: feedItem.summary,
      keyFacts: feedItem.keyPoints, // keyPoints → keyFacts mapping
      videoUrl: feedItem.videoUrl,
      masteredAt: null,
      sourceType: 'saved',
    });

    return res.status(201).json(vaultItem);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
