/**
 * learnFeedRoutes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * High-performance Express routes for LearnFeed:
 * - GET  /api/learnfeed          — Paginated feed (exact 10–12 items per batch)
 * - POST /api/learnfeed/refresh  — Fresh batch of 10–12 newly randomized posts
 * - POST /api/learnfeed/:id/like — Toggle like count & state
 * - POST /api/learnfeed/:id/bookmark — Toggle bookmark state
 * - GET  /api/learnfeed/:id/comments — Retrieve comments
 * - POST /api/learnfeed/:id/comments — Add a new discussion comment
 */

const router = require('express').Router();
const { LEARN_POSTS } = require('../data/learnFeedData');

// In-memory runtime state for live interactive likes, bookmarks, and comments
const postLikes = new Map();
const postBookmarks = new Map();
const postComments = new Map();

// Seed default comments
LEARN_POSTS.forEach((p) => {
  postLikes.set(p.id, p.likesCount || 100);
  postBookmarks.set(p.id, p.bookmarksCount || 50);
  postComments.set(p.id, [
    {
      id: `c-${p.id}-1`,
      user: 'alex_codes',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      text: 'Brilliant visual breakdown! The real-world production context makes this click.',
      time: '1h ago',
    },
    {
      id: `c-${p.id}-2`,
      user: 'sarah_dev',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      text: 'We actually implemented this exact pattern last sprint and reduced p99 latency by 40%.',
      time: '35m ago',
    },
  ]);
});

// Helper: Shuffle array for refresh batches
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── GET /api/learnfeed ────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(12, Math.max(10, parseInt(req.query.limit, 10) || 10));
    const tag = (req.query.tag || 'All').trim();

    let filtered = LEARN_POSTS;
    if (tag && tag.toLowerCase() !== 'all') {
      filtered = LEARN_POSTS.filter(
        (p) =>
          p.category.toLowerCase() === tag.toLowerCase() ||
          p.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
      );
    }

    const startIndex = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit).map((p) => ({
      ...p,
      likesCount: postLikes.get(p.id) || p.likesCount,
      bookmarksCount: postBookmarks.get(p.id) || p.bookmarksCount,
      commentsCount: (postComments.get(p.id) || []).length,
    }));

    const hasMore = startIndex + limit < filtered.length;

    return res.status(200).json({
      page,
      limit,
      total: filtered.length,
      hasMore,
      posts: paginatedItems,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/learnfeed/refresh ───────────────────────────────────────────────
router.post('/refresh', (req, res) => {
  try {
    const limit = Math.min(12, Math.max(10, parseInt(req.body?.limit || req.query.limit, 10) || 10));
    const tag = (req.body?.tag || req.query.tag || 'All').trim();

    let filtered = LEARN_POSTS;
    if (tag && tag.toLowerCase() !== 'all') {
      filtered = LEARN_POSTS.filter(
        (p) =>
          p.category.toLowerCase() === tag.toLowerCase() ||
          p.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
      );
    }

    // Shuffle and pick exact 10–12 items
    const freshBatch = shuffle(filtered).slice(0, limit).map((p) => ({
      ...p,
      likesCount: postLikes.get(p.id) || p.likesCount,
      bookmarksCount: postBookmarks.get(p.id) || p.bookmarksCount,
      commentsCount: (postComments.get(p.id) || []).length,
    }));

    return res.status(200).json({
      page: 1,
      limit,
      refreshedAt: new Date().toISOString(),
      hasMore: filtered.length > limit,
      posts: freshBatch,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/learnfeed/:id/like ──────────────────────────────────────────────
router.post('/:id/like', (req, res) => {
  const { id } = req.params;
  const currentLikes = postLikes.get(id) || 100;
  const isLiked = req.body?.isLiked ?? true;
  const updatedLikes = isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
  postLikes.set(id, updatedLikes);

  return res.status(200).json({
    id,
    likesCount: updatedLikes,
    isLiked,
  });
});

// ── POST /api/learnfeed/:id/bookmark ──────────────────────────────────────────
router.post('/:id/bookmark', (req, res) => {
  const { id } = req.params;
  const currentBookmarks = postBookmarks.get(id) || 50;
  const isBookmarked = req.body?.isBookmarked ?? true;
  const updatedBookmarks = isBookmarked ? currentBookmarks + 1 : Math.max(0, currentBookmarks - 1);
  postBookmarks.set(id, updatedBookmarks);

  return res.status(200).json({
    id,
    bookmarksCount: updatedBookmarks,
    isBookmarked,
  });
});

// ── GET /api/learnfeed/:id/comments ───────────────────────────────────────────
router.get('/:id/comments', (req, res) => {
  const { id } = req.params;
  const comments = postComments.get(id) || [];
  return res.status(200).json({ id, comments });
});

// ── POST /api/learnfeed/:id/comments ──────────────────────────────────────────
router.post('/:id/comments', (req, res) => {
  const { id } = req.params;
  const text = (req.body?.text || '').trim();
  const username = req.body?.username || 'you';

  if (!text) {
    return res.status(400).json({ error: 'Comment text is required.' });
  }

  const newComment = {
    id: `c-${id}-${Date.now()}`,
    user: username,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    text,
    time: 'Just now',
  };

  const existing = postComments.get(id) || [];
  existing.push(newComment);
  postComments.set(id, existing);

  return res.status(201).json(newComment);
});

module.exports = router;
