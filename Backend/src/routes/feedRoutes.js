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
const { deriveCategory, deriveHashtags } = require('../utils/tagUtils');

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

    // 2. Fetch all saved and liked items & tags from vaultitems for this specific user
    const userVaultDocs = await VaultItem.find({
      $or: [
        { userId: userId },
        { userId: user._id },
        { userId: String(user._id) },
      ]
    }).select('tags cat topic').lean();

    const userSavedTags = new Set();
    const userSavedCats = new Set();
    const userSavedKeywords = [];

    for (const doc of userVaultDocs) {
      if (doc.cat) {
        userSavedCats.add(doc.cat);
        userSavedKeywords.push(doc.cat);
      }
      if (Array.isArray(doc.tags)) {
        for (const t of doc.tags) {
          const cleanTag = t.replace(/^#/, '').trim();
          if (cleanTag) {
            userSavedTags.add(cleanTag.toLowerCase());
            userSavedKeywords.push(cleanTag);
          }
        }
      }
    }

    // Blend user's base interests with the specific tags from their vaultitems
    const blendedTopics = Array.from(new Set([...user.interests, ...userSavedKeywords.slice(0, 6)]));

    // 3. Fetch all previous post bodies/summaries for this user to guarantee deduplication
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

    function calculateAffinityScore(doc) {
      let score = 0;
      if (doc.cat && userSavedCats.has(doc.cat)) score += 3;
      if (Array.isArray(doc.tags)) {
        for (const t of doc.tags) {
          const clean = t.replace(/^#/, '').toLowerCase().trim();
          if (userSavedTags.has(clean) || userSavedTags.has(t.toLowerCase().trim())) {
            score += 5;
          }
        }
      }
      const lowerTopic = (doc.topic || '').toLowerCase();
      for (const kw of userSavedKeywords) {
        const cleanKw = kw.replace(/^#/, '').toLowerCase().trim();
        if (cleanKw && cleanKw.length > 2 && lowerTopic.includes(cleanKw)) {
          score += 4;
        }
      }
      return score;
    }

    function isTagMatched(doc) {
      return calculateAffinityScore(doc) > 0;
    }

    function blendFeedByRatio(allDocs, isRatio = 0.6, interestRatio = 0.4) {
      const tagPool = [];
      const interestPool = [];

      for (const rawDoc of allDocs) {
        const doc = rawDoc.toObject ? rawDoc.toObject() : { ...rawDoc };
        if (isTagMatched(doc)) {
          doc.isRecommended = true;
          tagPool.push(doc);
        } else {
          doc.isRecommended = false;
          interestPool.push(doc);
        }
      }

      // If user has no tag-matched items yet, return full interest pool
      if (tagPool.length === 0) return interestPool;
      if (interestPool.length === 0) return tagPool;

      const totalTarget = Math.min(allDocs.length, 30);
      const targetTagCount = Math.round(totalTarget * isRatio);
      const targetInterestCount = totalTarget - targetTagCount;

      const selectedTags = tagPool.slice(0, targetTagCount);
      const selectedInterests = interestPool.slice(0, targetInterestCount);

      // Backfill if one pool is smaller
      if (selectedTags.length < targetTagCount) {
        const diff = targetTagCount - selectedTags.length;
        selectedInterests.push(...interestPool.slice(targetInterestCount, targetInterestCount + diff));
      } else if (selectedInterests.length < targetInterestCount) {
        const diff = targetInterestCount - selectedInterests.length;
        selectedTags.push(...tagPool.slice(targetTagCount, targetTagCount + diff));
      }

      // Interleave in a 60% / 40% (3 Tag : 2 Interest) rhythm
      const blended = [];
      let tIdx = 0;
      let iIdx = 0;

      while (tIdx < selectedTags.length || iIdx < selectedInterests.length) {
        // 3 Tag-affinity posts (60%)
        for (let k = 0; k < 3 && tIdx < selectedTags.length; k++) {
          blended.push(selectedTags[tIdx++]);
        }
        // 2 Base interest posts (40%)
        for (let k = 0; k < 2 && iIdx < selectedInterests.length; k++) {
          blended.push(selectedInterests[iIdx++]);
        }
      }

      return blended;
    }

    // If NOT reloading and user already has valid feed items in DB: return blended 40% / 60% stream
    if (!isReload && userDocs.length > 0) {
      const existingFeed = await FeedItem.find({
        userId,
        source: 'interest',
      })
        .sort({ createdAt: -1 })
        .limit(1000);

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
        const blendedResult = blendFeedByRatio(cleanFeed, 0.6, 0.4);
        return res.status(200).json(blendedResult);
      }
    }

    // 4. Either reload=true OR user has insufficient clean items: Generate brand new, unique articles!
    const excludeBodies = new Set(dbBodies);
    const excludeTopics = new Set(dbTopics);
    const items = await pythonService.simplify(blendedTopics, excludeBodies, excludeTopics);

    // 5. Persist new articles to MongoDB, strictly checking both topic and body uniqueness
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

        const itemCat = deriveCategory(item.topic, item.cat || item.category);
        const itemTags = (Array.isArray(item.tags) && item.tags.length > 0)
          ? item.tags
          : deriveHashtags(item.topic, itemCat);

        await FeedItem.create({
          userId,
          topic: item.topic,
          cat: itemCat,
          tags: itemTags,
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

    // 6. Return the complete feed for this user blended at 40% Interests / 60% Tags:
    const allUserFeed = await FeedItem.find({
      userId,
      source: 'interest',
    })
      .sort({ createdAt: -1 })
      .limit(1000);

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

    const finalBlended = blendFeedByRatio(finalFeed, 0.6, 0.4);
    return res.status(200).json(finalBlended);
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

    // Copy into VaultItem with cat and tags inside the object
    const savedCat = feedItem.cat || deriveCategory(feedItem.topic);
    const savedTags = (Array.isArray(feedItem.tags) && feedItem.tags.length > 0)
      ? feedItem.tags
      : deriveHashtags(feedItem.topic, savedCat);

    const vaultItem = await VaultItem.create({
      userId,
      topic: feedItem.topic,
      cat: savedCat,
      tags: savedTags,
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
