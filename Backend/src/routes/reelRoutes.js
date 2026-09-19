/**
 * reelRoutes.js — AI Reels MongoDB CRUD & Streaming API
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides complete database persistence for AI video reels:
 * - GET  /api/reels          — Fetches reels (personalized by user interests or filtered by topic)
 * - GET  /api/reels/:id      — Retrieves a specific reel by ID or filename
 * - POST /api/reels/:id/like — Toggles like state and updates MongoDB metrics
 * - POST /api/reels/:id/view — Increments reel view count in MongoDB
 * - POST /api/reels/sync     — Synchronizes filesystem manifest.json into MongoDB 'reels' collection
 */

const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const ReelItem = require('../models/ReelItem');
const User = require('../models/User');

const MANIFEST_PATH = path.resolve(__dirname, '../../../generated_reels/manifest.json');

/**
 * Reads generated_reels/manifest.json directly from disk as resilient fallback.
 */
function getDiskManifestReels() {
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item, idx) => ({
          _id: `disk_${idx}_${item.filename}`,
          title: item.title,
          topic: item.topic,
          caption: item.caption || '',
          videoUrl: item.videoUrl || `/generated_reels/${item.filename}`,
          video_prompt: item.video_prompt || item.prompt || '',
          negative_prompt: item.negative_prompt || '',
          model: 'Wan 2.2 (Q6_K GGUF)',
          resolution: '720x1280',
          duration: 5.0,
          likes_count: 0,
          views_count: 0,
          liked_by: [],
          createdAt: item.createdAt || new Date(),
        }));
      }
    } catch (e) {
      console.warn('[reels] Error reading manifest fallback:', e.message);
    }
  }
  return [];
}

/**
 * Syncs manifest.json entries into MongoDB reels collection.
 */
async function syncManifestToDB() {
  if (mongoose.connection.readyState !== 1) return [];
  const diskReels = getDiskManifestReels();
  if (!diskReels.length) return [];

  const synced = [];
  for (const item of diskReels) {
    const filename = item.videoUrl ? item.videoUrl.split('/').pop() : `${item.topic}_1.mp4`;
    const updateData = {
      topic: item.topic,
      title: item.title,
      caption: item.caption,
      video_prompt: item.video_prompt,
      negative_prompt: item.negative_prompt,
      videoUrl: `/generated_reels/${filename}`,
      duration: 5.0,
      aspectRatio: '9:16',
      resolution: '720x1280',
      model: 'Wan 2.2 (Q6_K GGUF)',
      createdAt: item.createdAt || new Date(),
    };

    const doc = await ReelItem.findOneAndUpdate(
      { filename },
      { $setOnInsert: { likes_count: 0, views_count: 0, liked_by: [] }, $set: updateData },
      { upsert: true, new: true }
    );
    synced.push(doc);
  }
  return synced;
}

/**
 * Fisher-Yates array shuffle
 */
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ── GET /api/reels — Fetch all reels (personalized / filtered) ─────────────────
router.get('/reels', async (req, res, next) => {
  try {
    const { userId, topic } = req.query;

    // Check if MongoDB is connected
    const isDBConnected = mongoose.connection.readyState === 1;

    let reels = [];

    if (isDBConnected) {
      const query = {};
      if (topic) {
        query.topic = topic.toLowerCase();
      }

      reels = await ReelItem.find(query).sort({ createdAt: -1 }).lean();

      // If database is currently empty, automatically populate from manifest.json
      if (reels.length === 0) {
        console.log('[reels] MongoDB reels collection empty. Auto-seeding from manifest.json...');
        const seeded = await syncManifestToDB();
        reels = seeded.map(doc => (doc.toObject ? doc.toObject() : doc));
      }
    }

    // If still empty or DB disconnected, use disk manifest fallback
    if (!reels || reels.length === 0) {
      console.log('[reels] Using disk manifest fallback');
      reels = getDiskManifestReels();
      if (topic) {
        reels = reels.filter(r => r.topic.toLowerCase() === topic.toLowerCase());
      }
    }

    // If user has declared interests, rank matching topics first
    if (userId && isDBConnected) {
      try {
        const user = await User.findOne({ userId }).lean();
        if (user && Array.isArray(user.interests) && user.interests.length > 0) {
          const userInterests = user.interests.map(i => i.toLowerCase());
          const matching = [];
          const other = [];

          for (const r of reels) {
            if (userInterests.includes(r.topic.toLowerCase())) {
              matching.push(r);
            } else {
              other.push(r);
            }
          }
          reels = [...matching, ...shuffleArray(other)];
        }
      } catch (err) {
        console.warn('[reels] Interest personalization warning:', err.message);
      }
    }

    // Attach user-specific 'liked' flag
    const formatted = reels.map(r => ({
      ...r,
      liked: Boolean(userId && Array.isArray(r.liked_by) && r.liked_by.includes(userId)),
    }));

    return res.json({
      success: true,
      count: formatted.length,
      reels: formatted,
      storage: isDBConnected ? 'mongodb' : 'disk_manifest',
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/reels/:id — Retrieve single reel ─────────────────────────────────
router.get('/reels/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const isDBConnected = mongoose.connection.readyState === 1;

    let reel = null;
    if (isDBConnected) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        reel = await ReelItem.findById(id).lean();
      } else {
        reel = await ReelItem.findOne({ filename: id }).lean();
      }
    }

    if (!reel) {
      const diskReels = getDiskManifestReels();
      reel = diskReels.find(r => r._id === id || r.videoUrl.includes(id));
    }

    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    return res.json({ success: true, reel });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/reels/:id/like — Toggle like status ──────────────────────────────
router.post('/api/reels/:id/like', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId = 'anonymous' } = req.body;
    const isDBConnected = mongoose.connection.readyState === 1;

    if (!isDBConnected) {
      return res.json({ success: true, liked: true, likes_count: 1, storage: 'offline' });
    }

    let reelDoc = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      reelDoc = await ReelItem.findById(id);
    } else {
      reelDoc = await ReelItem.findOne({ filename: id });
    }

    if (!reelDoc) {
      return res.status(404).json({ error: 'Reel not found in database' });
    }

    const alreadyLiked = reelDoc.liked_by.includes(userId);
    if (alreadyLiked) {
      reelDoc.liked_by = reelDoc.liked_by.filter(u => u !== userId);
      reelDoc.likes_count = Math.max(0, reelDoc.likes_count - 1);
    } else {
      reelDoc.liked_by.push(userId);
      reelDoc.likes_count += 1;
    }

    await reelDoc.save();

    return res.json({
      success: true,
      liked: !alreadyLiked,
      likes_count: reelDoc.likes_count,
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/reels/:id/view — Increment views count ──────────────────────────
router.post('/api/reels/:id/view', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        await ReelItem.findByIdAndUpdate(id, { $inc: { views_count: 1 } });
      } else {
        await ReelItem.findOneAndUpdate({ filename: id }, { $inc: { views_count: 1 } });
      }
    }
    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/reels/sync — Manual/Automated Manifest -> MongoDB sync ───────────
router.post('/api/reels/sync', async (req, res, next) => {
  try {
    const syncedDocs = await syncManifestToDB();
    return res.json({
      success: true,
      message: `Synchronized ${syncedDocs.length} reel(s) to MongoDB`,
      count: syncedDocs.length,
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/reels/personalized-spec — Live Qwen 2.5:7b User-Adaptive Generator ─
router.post('/api/reels/personalized-spec', async (req, res, next) => {
  try {
    const { userId, topic = 'Technology', sub_angle = '' } = req.body;
    let userInterests = [];
    let likedReels = [];
    let username = 'Learner';

    if (mongoose.connection.readyState === 1 && userId) {
      try {
        if (mongoose.Types.ObjectId.isValid(userId)) {
          const userDoc = await User.findById(userId).lean();
          if (userDoc) {
            username = userDoc.username;
            userInterests = userDoc.interests || [];
          }
        }
        likedReels = await ReelItem.find({ liked_by: userId }).select('title topic caption').limit(5).lean();
      } catch (err) {
        console.warn('[reels] User context query note:', err.message);
      }
    }

    const systemPrompt = `You are a master cinematic director and fact-writer for short educational documentary video clips generated by Wan 2.2, a high-fidelity local AI video model. Wan 2.2 produces breathtaking, hyper-realistic footage when given concrete physical actions, authentic real-world cinematography, and explicit motion.

CRITICAL OBJECTIVE: You MUST tailor the scene's visual angle, cinematography style, and educational hook to the target USER'S PERSONAL INTERESTS and what they enjoy/like.

CRITICAL RULES:
1. ABSOLUTE BAN ON DRAWINGS & ANIMATIONS: The output must NEVER look like a cartoon, drawing, sketch, 3D CGI animation, anime, illustration, or painting.
2. MANDATORY REALISTIC CINEMATOGRAPHY: Specify camera gear & technique (e.g. '8K photorealistic IMAX documentary footage, shot on ARRI Alexa 65 with a 35mm master prime lens, natural directional lighting, shallow depth of field').
3. EXPLICIT PHYSICAL CAMERA MOTION: Mandate a clear physical camera move.
4. HIGH-VELOCITY PHYSICAL ACTION: Concrete, tangible subjects performing active, dynamic real-world motions.
5. USER PERSONALIZATION: Deeply align the subject focus and visual aesthetics with the user's declared interests and liked history.
6. NO TEXT/LOGOS: Do NOT describe words, subtitles, badges, or watermarks.

Output ONLY a valid JSON object with keys "video_prompt", "negative_prompt", and "caption".`;

    const userMessage = `Topic to direct: '${topic}'
${sub_angle ? `Sub-Angle / Specific Focus: ${sub_angle}` : ''}
Target User: @${username}
User's Declared Interests: ${userInterests.length > 0 ? userInterests.join(', ') : 'Science, Technology, Space, History'}
Content User Previously Liked & Enjoyed: ${likedReels.length > 0 ? likedReels.map(r => `'${r.title}' (${r.topic})`).join('; ') : 'None yet (first session)'}
Personalization Directive: Deeply personalize this scene's cinematography, subject details, and factual hook to resonate with the user's interests and favorite visual styles.`;

    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.MODEL_NAME || 'qwen2.5:7b',
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama responded with status ${response.status}`);
    }

    const data = await response.json();
    let rawContent = data.message?.content || '{}';
    if (rawContent.startsWith('```')) {
      rawContent = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
    }
    const spec = JSON.parse(rawContent);

    return res.json({
      success: true,
      user: { username, interests: userInterests, likedCount: likedReels.length },
      spec,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
