/**
 * tagUtils.js
 * Centralized Category derivation and Hashtag generation for MongoDB items.
 */

const KNOWN_CATEGORIES = [
  'Finance', 'Rights', 'Safety', 'Space', 'Technology', 'Science',
  'Philosophy', 'Economics', 'Psychology', 'Biology', 'Mathematics',
  'Politics', 'Health', 'Art', 'Climate', 'Architecture', 'Linguistics',
  'Everyday Tech', 'Cognitive Models', 'Everyday Engineering', 'Fascinating Knowledge'
];

function deriveCategory(topic = '', rawCat = '') {
  if (rawCat && KNOWN_CATEGORIES.includes(rawCat)) return rawCat;
  const lower = (topic || '').toLowerCase();
  if (lower.includes('credit') || lower.includes('saving') || lower.includes('tax') || lower.includes('money') || lower.includes('budget') || lower.includes('finance') || lower.includes('loan') || lower.includes('invest')) return 'Finance';
  if (lower.includes('tenant') || lower.includes('police') || lower.includes('right') || lower.includes('airline') || lower.includes('warrant') || lower.includes('law') || lower.includes('legal')) return 'Rights';
  if (lower.includes('heimlich') || lower.includes('burn') || lower.includes('fire') || lower.includes('cpr') || lower.includes('choking') || lower.includes('safety') || lower.includes('first aid')) return 'Safety';
  if (lower.includes('space') || lower.includes('galaxy') || lower.includes('telescope') || lower.includes('orbit') || lower.includes('black hole') || lower.includes('moon') || lower.includes('mars') || lower.includes('solar')) return 'Space';
  if (lower.includes('quantum') || lower.includes('ai') || lower.includes('algorithm') || lower.includes('network') || lower.includes('computer') || lower.includes('software') || lower.includes('code') || lower.includes('tech')) return 'Technology';
  if (lower.includes('biology') || lower.includes('dna') || lower.includes('cell') || lower.includes('ocean') || lower.includes('species') || lower.includes('biolum')) return 'Biology';
  if (lower.includes('economic') || lower.includes('inflation') || lower.includes('game theory') || lower.includes('market') || lower.includes('supply')) return 'Economics';
  if (lower.includes('psycholog') || lower.includes('bias') || lower.includes('cognitive') || lower.includes('brain') || lower.includes('memory') || lower.includes('habit')) return 'Psychology';
  if (lower.includes('philosoph') || lower.includes('ethics') || lower.includes('stoic') || lower.includes('logic')) return 'Philosophy';
  if (lower.includes('health') || lower.includes('sleep') || lower.includes('nutrition') || lower.includes('diet') || lower.includes('circadian') || lower.includes('exercise')) return 'Health';
  if (lower.includes('history') || lower.includes('rome') || lower.includes('empire') || lower.includes('war') || lower.includes('renaissance') || lower.includes('ancient')) return 'History';

  const found = KNOWN_CATEGORIES.find(c => lower.includes(c.toLowerCase()));
  return found || (rawCat ? rawCat : 'General');
}

function deriveHashtags(topic = '', category = '') {
  const cat = category || deriveCategory(topic);
  const cleanCatTag = `#${cat.replace(/\s+/g, '')}`;
  const tags = [cleanCatTag];

  const stopWords = new Set([
    'about', 'their', 'which', 'there', 'where', 'these', 'those', 'under',
    'after', 'with', 'from', 'into', 'that', 'this', 'what', 'when', 'your',
    'how', 'why', 'core', 'laws', 'principles', 'investigation', 'study', 'reference'
  ]);

  const words = (topic || '')
    .split(/[\s:,\-_/()]+/)
    .map(w => w.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(w => w.length >= 3 && !stopWords.has(w.toLowerCase()));

  for (const w of words) {
    const formattedTag = `#${w.charAt(0).toUpperCase() + w.slice(1)}`;
    if (!tags.some(t => t.toLowerCase() === formattedTag.toLowerCase()) && tags.length < 5) {
      tags.push(formattedTag);
    }
  }

  return tags;
}

module.exports = { deriveCategory, deriveHashtags, KNOWN_CATEGORIES };
