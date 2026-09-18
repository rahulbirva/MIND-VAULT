/**
 * pythonService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Thin wrapper around the external Python AI microservice.
 * All outbound HTTP calls live here so the rest of the codebase stays clean.
 *
 * When MOCK_MODE=true every function returns static fixture data that matches
 * the exact same JSON shape the real service would return.
 */

const axios = require('axios');

const IS_MOCK = process.env.MOCK_MODE === 'true';
const BASE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

// ── Mock fixtures ─────────────────────────────────────────────────────────────

const MOCK_FEED_ITEMS = [
  {
    topic: 'Space Exploration',
    summary:
      'Humanity has been venturing into space since 1957, driven by scientific curiosity, national prestige, and the long-term goal of becoming a multi-planetary species.',
    keyPoints: [
      'Sputnik 1 (1957) was the first artificial satellite.',
      'The Apollo 11 mission landed humans on the Moon in 1969.',
      'Private companies like SpaceX have dramatically reduced launch costs.',
      'Mars is the current focal point for crewed exploration ambitions.',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=aY-0uBIYYKk',
  },
  {
    topic: 'Political Systems',
    summary:
      'Political systems define how power is organized and exercised within a society, ranging from direct democracies to authoritarian regimes.',
    keyPoints: [
      'Democracy involves citizens electing their representatives.',
      'Authoritarianism concentrates power in a single leader or party.',
      'Federal systems distribute power between central and regional governments.',
      'Electoral systems (FPTP, proportional representation) shape political outcomes.',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=pZnOdkDXKvk',
  },
  {
    topic: 'Ancient History',
    summary:
      'Ancient civilizations laid the cultural, legal, and technological foundations that underpin modern societies worldwide.',
    keyPoints: [
      'Mesopotamia (c. 3500 BCE) produced the first writing system — cuneiform.',
      'Ancient Egypt built monumental architecture that still stands today.',
      'Greek philosophy introduced logic, ethics, and scientific inquiry.',
      'Rome spread legal systems and infrastructure across three continents.',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=ub4lVXhT0Mk',
  },
];

const MOCK_DEEP_DIVE = {
  topic: 'Black Holes',
  summary:
    'A black hole is a region of spacetime where gravity is so strong that nothing — not even light — can escape once it crosses the event horizon.',
  keyFacts: [
    'Black holes form from collapsed massive stars (stellar black holes) or from the early universe (primordial black holes).',
    'The event horizon is the point of no return; anything crossing it is lost to the outside universe.',
    'Hawking radiation (1974) predicts that black holes slowly evaporate over astronomical timescales.',
    'Supermassive black holes (millions to billions of solar masses) sit at the centres of most large galaxies.',
    'The first image of a black hole (M87*) was captured by the Event Horizon Telescope in 2019.',
  ],
  videoUrl: 'https://www.youtube.com/watch?v=e-P5IFTqB98',
  questions: [
    'What happens to an object that crosses a black hole\'s event horizon, and why can\'t it escape?',
    'How does Hawking radiation challenge the idea that black holes only absorb and never emit anything?',
    'Why do scientists believe supermassive black holes play a key role in galactic evolution?',
  ],
};

const MOCK_GRADE_PASS = {
  passed: true,
  feedback:
    'Excellent work! Your answers demonstrate a solid conceptual grasp of black holes, covering the event horizon, Hawking radiation, and galactic co-evolution accurately.',
};

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Call POST /simplify on the Python service.
 * @param {string[]} topics
 * @returns {Promise<Array<{topic, summary, keyPoints, videoUrl}>>}
 */
async function simplify(topics) {
  if (IS_MOCK) {
    // Return only as many mock items as topics requested (cycle if needed)
    return topics.map((t, i) => ({
      ...MOCK_FEED_ITEMS[i % MOCK_FEED_ITEMS.length],
      topic: t, // override topic so the name matches what was requested
    }));
  }

  try {
    const { data } = await axios.post(`${BASE_URL}/simplify`, { topics });
    return data;
  } catch (err) {
    const msg = err.response?.data?.detail || err.message;
    throw Object.assign(new Error(`Python /simplify failed: ${msg}`), { isPythonError: true });
  }
}

/**
 * Call POST /deepdive on the Python service.
 * @param {string} topic
 * @returns {Promise<{topic, summary, keyFacts, videoUrl, questions}>}
 */
async function deepDive(topic) {
  if (IS_MOCK) {
    return { ...MOCK_DEEP_DIVE, topic };
  }

  try {
    const { data } = await axios.post(`${BASE_URL}/deepdive`, { topic });
    return data;
  } catch (err) {
    const msg = err.response?.data?.detail || err.message;
    throw Object.assign(new Error(`Python /deepdive failed: ${msg}`), { isPythonError: true });
  }
}

/**
 * Call POST /grade on the Python service.
 * @param {string} topic
 * @param {string[]} questions
 * @param {string[]} answers
 * @returns {Promise<{passed: boolean, feedback: string}>}
 */
async function grade(topic, questions, answers) {
  if (IS_MOCK) {
    return MOCK_GRADE_PASS;
  }

  try {
    const { data } = await axios.post(`${BASE_URL}/grade`, { topic, questions, answers });
    return data;
  } catch (err) {
    const msg = err.response?.data?.detail || err.message;
    throw Object.assign(new Error(`Python /grade failed: ${msg}`), { isPythonError: true });
  }
}

module.exports = { simplify, deepDive, grade };
