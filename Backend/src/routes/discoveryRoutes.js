/**
 * discoveryRoutes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GET /api/discovery — daily discovery feed (topics NOT tied to user interests)
 *
 * Rotates through a hardcoded topic pool so the content feels fresh each call.
 * The rotation is time-based (uses the current day-of-year) so the same topics
 * appear for everyone on the same day — feels "daily" without needing a cron.
 */

const router = require('express').Router();
const FeedItem = require('../models/FeedItem');
const pythonService = require('../services/pythonService');

// ── Topic pool ────────────────────────────────────────────────────────────────
const DISCOVERY_POOL = [
  'Ancient Rome',
  'Black Holes',
  'Election Systems',
  'The Renaissance',
  'Quantum Computing',
  'The Silk Road',
  'Climate Science',
  'The French Revolution',
  'Neural Networks',
  'The Byzantine Empire',
  'Game Theory',
  'The Mongol Empire',
  'Plate Tectonics',
  'The Cold War',
  'Fermentation Science',
];

// Pick 3 topics from the pool, rotating daily
function getDailyTopics(count = 3) {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86_400_000
  );
  const start = (dayOfYear * count) % DISCOVERY_POOL.length;
  const topics = [];
  for (let i = 0; i < count; i++) {
    topics.push(DISCOVERY_POOL[(start + i) % DISCOVERY_POOL.length]);
  }
  return topics;
}

// ── GET /api/discovery ────────────────────────────────────────────────────────

router.get('/discovery', async (req, res, next) => {
  try {
    const topics = getDailyTopics(3);

    // Call Python service
    const items = await pythonService.simplify(topics);

    // Persist as FeedItems with source = "discovery" (no userId)
    const saved = await Promise.all(
      items.map((item) =>
        FeedItem.create({
          userId: null,
          topic: item.topic,
          summary: item.summary,
          keyPoints: item.keyPoints || [],
          videoUrl: item.videoUrl || null,
          source: 'discovery',
        })
      )
    );

    return res.status(200).json(saved);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
