/**
 * userRoutes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/user/interests — upsert a user's interest list.
 */

const router = require('express').Router();
const User = require('../models/User');

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

    if (!Array.isArray(interests) || interests.length === 0) {
      return res.status(400).json({ error: '`interests` must be a non-empty array of strings.' });
    }

    // Normalise: trim whitespace and remove duplicates
    const cleaned = [...new Set(interests.map((i) => String(i).trim()).filter(Boolean))];

    let user;

    if (userId) {
      user = await User.findByIdAndUpdate(
        userId,
        { interests: cleaned },
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({ error: `User with id ${userId} not found.` });
      }
    } else {
      // Create a brand-new demo user
      user = await User.create({ interests: cleaned });
    }

    return res.status(200).json({ userId: user._id, interests: user.interests });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
