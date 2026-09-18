/**
 * discoveryRoutes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GET  /api/discovery    — daily discovery feed (topics NOT tied to user interests)
 * POST /api/discover-law — Mental Model Discovery Engine (Ollama llama3 synthesizer)
 */

const router = require('express').Router();
const FeedItem = require('../models/FeedItem');
const pythonService = require('../services/pythonService');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// ── EXACT System Prompt for Mental Model Discovery Engine ────────────────────
const DISCOVERY_SYSTEM_PROMPT = `You are the MindVault Discovery Engine. Your task is to act as a proactive knowledge synthesizer and mentor.
I will provide you with:
1. USER VAULT CONTEXT: A list of concepts the user has already saved.

CRITICAL INSTRUCTIONS:
1. NO REPEATS: Do not suggest any concept present in the USER VAULT CONTEXT.
2. THE TARGET: Select ONE highly practical mental model or universal law (e.g., Parkinson's Law, Chesterton's Fence, etc.).
3. THE ANCHOR: Explain this new law by anchoring it directly to the concepts the user already knows.

You must output ONLY raw, valid JSON matching this schema exactly:
{
  "discovered_law": "String",
  "real_world_utility": "String",
  "anchor_explanation": "String",
  "bridge_analogy": "String",
  "actionable_takeaway": "String"
}`;

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

// ── POST /api/discovery/daily-post ───────────────────────────────────────────
router.post('/discovery/daily-post', async (req, res, next) => {
  try {
    const userId = req.body?.userId || 'default_user';
    const discoveryPost = await pythonService.getDailyDiscovery(userId);
    return res.status(200).json(discoveryPost);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/discover-law ────────────────────────────────────────────────────
router.post('/discover-law', async (req, res, next) => {
  try {
    const { vaultContext } = req.body;

    // Validate and format vaultContext
    let contextList = [];
    if (Array.isArray(vaultContext) && vaultContext.length > 0) {
      contextList = vaultContext.map((c) => String(c).trim()).filter(Boolean);
    }

    if (contextList.length === 0) {
      contextList = ['Software Engineering', 'Database Design', 'System Architecture'];
    }

    const promptText = `USER VAULT CONTEXT:\n${contextList.map((c) => `- ${c}`).join('\n')}`;

    let ollamaResponse;
    try {
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3',
          system: DISCOVERY_SYSTEM_PROMPT,
          prompt: promptText,
          format: 'json',
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama responded with HTTP ${response.status}`);
      }

      ollamaResponse = await response.json();
    } catch (ollamaErr) {
      console.error('[discover-law] Failed to connect to Ollama:', ollamaErr.message);
      return res.status(500).json({
        error: 'Local Ollama AI service is offline or unreachable. Please ensure Ollama is running on port 11434 with llama3 loaded.',
        detail: ollamaErr.message,
      });
    }

    if (!ollamaResponse || !ollamaResponse.response) {
      return res.status(500).json({
        error: 'Ollama returned an empty response.',
      });
    }

    // Parse and structure JSON output
    try {
      const rawText = ollamaResponse.response.trim();
      const parsedData = JSON.parse(rawText);

      const result = {
        discovered_law: parsedData.discovered_law || 'Conway\'s Law',
        real_world_utility: parsedData.real_world_utility || 'Organizations build systems that mirror their internal communication structures.',
        anchor_explanation: parsedData.anchor_explanation || 'This model connects directly to your understanding of architectural components and modular boundaries.',
        bridge_analogy: parsedData.bridge_analogy || 'Just like decoupled modules reduce cross-system bugs, decoupled teams prevent coordination overhead.',
        actionable_takeaway: parsedData.actionable_takeaway || 'Align team structure directly with the target architecture you wish to build.',
      };

      return res.status(200).json(result);
    } catch (jsonErr) {
      console.error('[discover-law] Failed to parse Ollama JSON:', jsonErr.message, ollamaResponse.response);
      return res.status(500).json({
        error: 'Failed to parse mental model output from Ollama into valid JSON schema.',
        raw: ollamaResponse.response,
      });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
