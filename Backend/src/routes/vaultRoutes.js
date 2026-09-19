/**
 * vaultRoutes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GET /api/vault?userId=... — return all VaultItems for a user (newest first)
 */

const router = require('express').Router();
const VaultItem = require('../models/VaultItem');

router.get('/vault', async (req, res, next) => {
  try {
    const { userId, sourceType } = req.query;

    if (!userId) {
      return res.status(400).json({ error: '`userId` query parameter is required.' });
    }

    const query = { userId };
    if (sourceType) {
      query.sourceType = sourceType;
    }

    const items = await VaultItem.find(query).sort({ createdAt: -1 });

    return res.status(200).json(items);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/vault/like ───────────────────────────────────────────────────────
router.post('/vault/like', async (req, res, next) => {
  try {
    const { userId, topic, body, summary, keyFacts, imageUrl, videoUrl, cat, tags } = req.body;

    if (!userId || !topic) {
      return res.status(400).json({ error: '`userId` and `topic` are required.' });
    }

    const cleanTopic = String(topic).trim();

    // Check if already liked
    let existing = await VaultItem.findOne({ userId, topic: cleanTopic, sourceType: 'liked' });
    if (existing) {
      return res.status(200).json(existing);
    }

    const item = await VaultItem.create({
      userId,
      topic: cleanTopic,
      body: body || summary || '',
      summary: summary || body || '',
      keyFacts: Array.isArray(keyFacts) ? keyFacts : [],
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null,
      cat: cat || '',
      tags: Array.isArray(tags) ? tags : [],
      sourceType: 'liked',
    });

    return res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/vault/unlike ─────────────────────────────────────────────────────
router.post('/vault/unlike', async (req, res, next) => {
  try {
    const { userId, topic } = req.body;

    if (!userId || !topic) {
      return res.status(400).json({ error: '`userId` and `topic` are required.' });
    }

    const cleanTopic = String(topic).trim();
    await VaultItem.deleteMany({ userId, topic: cleanTopic, sourceType: 'liked' });

    return res.status(200).json({ success: true, topic: cleanTopic });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
