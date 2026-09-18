/**
 * deepDiveRoutes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/deepdive          — fetch crash-course + quiz questions
 * POST /api/deepdive/answer   — submit answers, grade, optionally vault topic
 */

const router = require('express').Router();
const VaultItem = require('../models/VaultItem');
const QuizAttempt = require('../models/QuizAttempt');
const pythonService = require('../services/pythonService');

// ── POST /api/deepdive ────────────────────────────────────────────────────────

router.post('/deepdive', async (req, res, next) => {
  try {
    const { userId, topic } = req.body;

    if (!userId) {
      return res.status(400).json({ error: '`userId` is required.' });
    }
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: '`topic` must be a non-empty string.' });
    }

    // Forward to Python service — do NOT persist anything yet
    const result = await pythonService.deepDive(topic.trim());

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/deepdive/answer ─────────────────────────────────────────────────

router.post('/deepdive/answer', async (req, res, next) => {
  try {
    const { userId, topic, questions, answers } = req.body;

    // Input validation
    if (!userId) {
      return res.status(400).json({ error: '`userId` is required.' });
    }
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: '`topic` must be a non-empty string.' });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: '`questions` must be a non-empty array.' });
    }
    if (!Array.isArray(answers) || answers.length !== questions.length) {
      return res.status(400).json({
        error: '`answers` must be an array of the same length as `questions`.',
      });
    }

    const cleanTopic = topic.trim();

    // 1. Grade via Python service
    const { passed, feedback } = await pythonService.grade(cleanTopic, questions, answers);

    // 2. Always persist the quiz attempt (pass or fail)
    await QuizAttempt.create({
      userId,
      topic: cleanTopic,
      questions,
      answers,
      passed,
      feedback: feedback || '',
    });

    // 3. If passed → create VaultItem with sourceType "mastered"
    if (passed) {
      // Avoid duplicate vault entries for the same user + topic
      const exists = await VaultItem.findOne({ userId, topic: cleanTopic, sourceType: 'mastered' });
      if (!exists) {
        // Re-fetch the deep-dive data for the vault entry (summary + keyFacts)
        let diveData;
        try {
          diveData = await pythonService.deepDive(cleanTopic);
        } catch (_) {
          // If the second call fails, still save the vault entry with minimal data
          diveData = { summary: '', keyFacts: [], videoUrl: null };
        }

        await VaultItem.create({
          userId,
          topic: cleanTopic,
          summary: diveData.summary || '',
          keyFacts: diveData.keyFacts || [],
          videoUrl: diveData.videoUrl || null,
          masteredAt: new Date(),
          sourceType: 'mastered',
        });
      }
    }

    return res.status(200).json({ passed, feedback });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
