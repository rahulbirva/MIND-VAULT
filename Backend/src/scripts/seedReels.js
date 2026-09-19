/**
 * seedReels.js — One-time seed script for AI ReelItems.
 * Reads generated_reels/manifest.json and inserts all entries into MongoDB.
 * Resilient and idempotent — skips if already seeded.
 *
 * Run standalone with:
 *    node src/scripts/seedReels.js
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const tls = require('tls');
tls.DEFAULT_CIPHERS = 'DEFAULT@SECLEVEL=1';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const ReelItem = require('../models/ReelItem');

const MANIFEST_PATH = path.resolve(__dirname, '../../../generated_reels/manifest.json');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mindvault';

async function seedReels() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.warn(`⚠️  manifest.json not found at ${MANIFEST_PATH}. Run 'python generate_reels.py' first.`);
    return { seeded: 0, skipped: 0, total: 0 };
  }

  let manifest = [];
  try {
    const raw = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    manifest = JSON.parse(raw);
  } catch (err) {
    console.error(`❌  Failed to parse manifest.json:`, err.message);
    return { seeded: 0, skipped: 0, total: 0 };
  }

  if (!Array.isArray(manifest) || manifest.length === 0) {
    console.log(`ℹ️  manifest.json is empty.`);
    return { seeded: 0, skipped: 0, total: 0 };
  }

  let seeded = 0;
  let skipped = 0;

  for (const item of manifest) {
    if (!item.filename || !item.topic || !item.title) continue;

    const existing = await ReelItem.findOne({ filename: item.filename });
    const videoPrompt = item.video_prompt || item.prompt || '';
    if (existing) {
      let updated = false;
      if (item.caption && (!existing.caption || existing.caption !== item.caption)) {
        existing.caption = item.caption;
        updated = true;
      }
      if (videoPrompt && (!existing.video_prompt || existing.video_prompt !== videoPrompt)) {
        existing.video_prompt = videoPrompt;
        existing.prompt = videoPrompt;
        updated = true;
      }
      if (updated) {
        await existing.save();
        seeded++;
      } else {
        skipped++;
      }
      continue;
    }

    await ReelItem.create({
      topic: item.topic.toLowerCase().trim(),
      filename: item.filename,
      title: item.title,
      caption: item.caption || '',
      prompt: videoPrompt,
      video_prompt: videoPrompt,
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    });
    seeded++;
  }

  console.log(`✅  Reels Seed Finished: ${seeded} inserted, ${skipped} already existed. Total: ${manifest.length}`);
  return { seeded, skipped, total: manifest.length };
}

// Standalone execution
if (require.main === module) {
  mongoose
    .connect(MONGO_URI, {
      family: 4,
      tlsAllowInvalidCertificates: true,
      serverSelectionTimeoutMS: 10000,
    })
    .then(async () => {
      console.log('📦  Connected to MongoDB for reels seeding...');
      await seedReels();
      await mongoose.disconnect();
      console.log('👋  Done and disconnected.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌  MongoDB connection error during reels seeding:', err.message);
      process.exit(1);
    });
}

module.exports = seedReels;
