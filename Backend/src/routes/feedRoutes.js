/**
 * feedRoutes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GET  /api/feed?userId=...&reload=true  — personalised interest feed (new articles first, seen articles go out)
 * POST /api/feed/:id/save               — copy FeedItem → VaultItem (sourceType "saved") & mark seen
 * POST /api/feed/:id/dismiss            — mark FeedItem as seen (removes from active feed)
 */

const router = require('express').Router();
const User = require('../models/User');
const FeedItem = require('../models/FeedItem');
const VaultItem = require('../models/VaultItem');
const pythonService = require('../services/pythonService');

function normalizeTopic(topic = '') {
  return (topic || '')
    .toLowerCase()
    .replace(/^(history|politics|health|economics|space|technology|science|philosophy|psychology|biology|mathematics|art):\s*/i, '')
    .trim();
}

function normalizeBody(body = '') {
  return (body || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 60);
}

function isRepetitiveLegacyItem(doc) {
  const text = `${doc.topic || ''} ${doc.body || ''} ${doc.summary || ''}`;
  return (
    /Module \d+/i.test(text) ||
    /At the foundational level.*operates on core principles/i.test(text) ||
    /The cutting-edge frontier of.*is experiencing a profound paradigm shift/i.test(text) ||
    /Much of what is commonly assumed about.*turns out to be incomplete/i.test(text) ||
    /The global footprint of.*extends far beyond academic laboratories/i.test(text) ||
    /Archive #/i.test(text) ||
    /^(Foundations of|The Frontier of|Counter-Intuitive Truths in|Global Dimensions of)\s/i.test(doc.topic || '')
  );
}

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

    // 1. Fetch all previous post bodies/summaries for this user to guarantee deduplication
    const userDocs = await FeedItem.find({ userId }).select('body summary topic').lean();
    const dbBodies = new Set(
      userDocs
        .flatMap((u) => [normalizeBody(u.body), normalizeBody(u.summary)])
        .filter(Boolean)
    );
    const dbTopics = new Set(
      userDocs.map((u) => normalizeTopic(u.topic)).filter(Boolean)
    );

    const isReload = req.query.reload === 'true' || req.query.refresh === 'true';

    // If NOT reloading and user already has valid feed items in DB: return them sorted newest first
    if (!isReload && userDocs.length > 0) {
      const existingFeed = await FeedItem.find({
        userId,
        source: 'interest',
      })
        .sort({ createdAt: -1 })
        .limit(30);

      const seenTopics = new Set();
      const seenBodies = new Set();
      const cleanFeed = [];
      for (const it of existingFeed) {
        if (isRepetitiveLegacyItem(it)) continue;
        const topicKey = normalizeTopic(it.topic);
        const bodyKey = normalizeBody(it.body || it.summary);
        if (topicKey && !seenTopics.has(topicKey) && bodyKey && !seenBodies.has(bodyKey)) {
          seenTopics.add(topicKey);
          seenBodies.add(bodyKey);
          cleanFeed.push(it);
        }
      }
      if (cleanFeed.length >= user.interests.length) {
        return res.status(200).json(cleanFeed);
      }
    }

    // 2. Either reload=true OR user has insufficient clean items: Generate brand new, unique articles!
    const excludeBodies = new Set(dbBodies);
    const items = await pythonService.simplify(user.interests, excludeBodies);

    // 3. Persist new articles to MongoDB, strictly checking both topic and body uniqueness
    const insertedInThisBatch = new Set();
    for (const item of items) {
      if (isRepetitiveLegacyItem(item)) continue;
      const bText = (item.body || item.summary || '').trim();
      const sText = (item.summary || item.body || '').trim();
      const bodyKey = normalizeBody(bText);
      const topicKey = normalizeTopic(item.topic);

      if (
        topicKey &&
        !dbTopics.has(topicKey) &&
        !insertedInThisBatch.has(topicKey) &&
        bodyKey &&
        !dbBodies.has(bodyKey)
      ) {
        insertedInThisBatch.add(topicKey);
        dbTopics.add(topicKey);
        dbBodies.add(bodyKey);

        const imgUrl =
          item.imageUrl ||
          (item.videoUrl && item.videoUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) ? item.videoUrl : null) ||
          pythonService.getImageUrlForTopic(item.topic, insertedInThisBatch.size);

        await FeedItem.create({
          userId,
          topic: item.topic,
          body: bText,
          summary: sText,
          imageUrl: imgUrl,
          keyPoints: item.keyPoints || [],
          videoUrl: item.videoUrl || null,
          source: 'interest',
          seen: false,
          createdAt: new Date(),
        });
      }
    }

    // 4. Return the complete feed for this user:
    // Sorted { createdAt: -1 } so:
    // -> Newer info comes in the beginning (at the top)!
    // -> Whatever was given before goes down below!
    // -> Strictly deduplicated by both topic and body so no duplicates ever repeat!
    const allUserFeed = await FeedItem.find({
      userId,
      source: 'interest',
    })
      .sort({ createdAt: -1 })
      .limit(30);

    const finalSeenTopics = new Set();
    const finalSeenBodies = new Set();
    const finalFeed = [];
    for (const doc of allUserFeed) {
      if (isRepetitiveLegacyItem(doc)) continue;
      const topicKey = normalizeTopic(doc.topic);
      const bodyKey = normalizeBody(doc.body || doc.summary);

      if (topicKey && !finalSeenTopics.has(topicKey) && bodyKey && !finalSeenBodies.has(bodyKey)) {
        finalSeenTopics.add(topicKey);
        finalSeenBodies.add(bodyKey);
        finalFeed.push(doc);
      }
    }

    return res.status(200).json(finalFeed);
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

    // Mark feed item as seen once saved to vault
    feedItem.seen = true;
    feedItem.seenAt = new Date();
    await feedItem.save();

    // Copy into VaultItem
    const vaultItem = await VaultItem.create({
      userId,
      topic: feedItem.topic,
      body: feedItem.body || feedItem.summary || '',
      summary: feedItem.summary || feedItem.body || '',
      keyFacts: feedItem.keyPoints || [],
      videoUrl: feedItem.videoUrl || null,
      imageUrl: feedItem.imageUrl || null,
      masteredAt: null,
      sourceType: 'saved',
    });

    return res.status(201).json(vaultItem);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/feed/:id/dismiss ─────────────────────────────────────────────────

router.post('/feed/:id/dismiss', async (req, res, next) => {
  try {
    const { id } = req.params;
    await FeedItem.findByIdAndUpdate(id, { seen: true, seenAt: new Date() });
    return res.status(200).json({ success: true, id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
