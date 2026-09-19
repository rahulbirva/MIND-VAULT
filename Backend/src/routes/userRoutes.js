/**
 * userRoutes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GET    /api/user/profile       — fetch user details (name, email, interests)
 * POST   /api/user/interests     — upsert/replace user's full interest list
 * POST   /api/user/interests/add — add a new interest to user's list
 * DELETE /api/user/interests     — remove an interest from user's list
 */

const router = require('express').Router();
const User = require('../models/User');

/**
 * GET /api/user/profile?userId=...
 * Returns: { userId, username, email, interests, createdAt }
 */
router.get('/profile', async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: '`userId` query parameter is required.' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: `User with id ${userId} not found.` });
    }

    return res.status(200).json({
      userId: user._id,
      username: user.username,
      email: user.email,
      interests: user.interests || [],
      createdAt: user.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/user/interests
 * Body: { userId?: string, interests: string[] }
 *
 * - If userId is provided, finds that user and replaces their interests.
 * - If userId is omitted, creates a new User document and returns the new _id.
 * - Trims and de-dupes the interests array before saving.
 */
router.post('/interests', async (req, res, next) => {
  try {
    const { userId, interests } = req.body;

    if (!Array.isArray(interests)) {
      return res.status(400).json({ error: '`interests` must be an array of strings.' });
    }

    // Normalise: trim whitespace and remove duplicates
    const cleaned = [...new Set(interests.map((i) => String(i).trim().toLowerCase()).filter(Boolean))];

    let user;

    if (userId) {
      user = await User.findByIdAndUpdate(
        userId,
        { interests: cleaned },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ error: `User with id ${userId} not found.` });
      }
    } else {
      // Create a brand-new demo user
      user = await User.create({ interests: cleaned });
    }

    return res.status(200).json({
      userId: user._id,
      username: user.username,
      email: user.email,
      interests: user.interests,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/user/interests/add
 * Body: { userId: string, interest: string }
 * Adds a single interest to user's list.
 */
router.post('/interests/add', async (req, res, next) => {
  try {
    const { userId, interest } = req.body;

    if (!userId || !interest) {
      return res.status(400).json({ error: '`userId` and `interest` are required.' });
    }

    const cleanInterest = String(interest).trim().toLowerCase();
    if (!cleanInterest) {
      return res.status(400).json({ error: '`interest` cannot be empty.' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { interests: cleanInterest } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: `User with id ${userId} not found.` });
    }

    return res.status(200).json({
      userId: user._id,
      username: user.username,
      email: user.email,
      interests: user.interests,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/user/interests
 * Body: { userId: string, interest: string }
 * Removes a single interest from user's list.
 */
router.delete('/interests', async (req, res, next) => {
  try {
    const { userId, interest } = req.body;

    if (!userId || !interest) {
      return res.status(400).json({ error: '`userId` and `interest` are required.' });
    }

    const cleanInterest = String(interest).trim().toLowerCase();

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { interests: cleanInterest } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: `User with id ${userId} not found.` });
    }

    return res.status(200).json({
      userId: user._id,
      username: user.username,
      email: user.email,
      interests: user.interests,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

