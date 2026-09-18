/**
 * authRoutes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/auth/signup  — create account (email, username, password)
 * POST /api/auth/login   — verify credentials (username, password)
 */

const router = require('express').Router();
const User   = require('../models/User');

/**
 * POST /api/auth/signup
 * Body: { email, username, password }
 * Returns: { userId, username }
 * Errors:  400 (validation), 409 (username/email taken)
 */
router.post('/signup', async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required.' });
    }
    if (username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if username already taken
    const existingUsername = await User.findOne({ username: username.trim().toLowerCase() });
    if (existingUsername) {
      return res.status(409).json({ error: 'Username already taken. Please choose another one.' });
    }

    // Check if email already used
    const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = await User.create({
      email:    email.trim().toLowerCase(),
      username: username.trim().toLowerCase(),
      password: password,
    });

    return res.status(201).json({ userId: user._id, username: user.username });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Returns: { userId, username, hasInterests }
 * Errors:  400 (missing fields), 401 (wrong credentials)
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    return res.status(200).json({
      userId:       user._id,
      username:     user.username,
      hasInterests: user.interests.length > 0,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
