/**
 * migrateAddTagsToAllDocuments.js
 * Updates every document in MongoDB 'vaultitems' and 'feeditems' collections
 * so 'cat' and 'tags' fields are guaranteed to exist on ALL documents.
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { deriveCategory, deriveHashtags } = require('./utils/tagUtils');

async function migrateDatabase(dbUri, label) {
  console.log(`\n========================================`);
  console.log(`🚀 Starting Migration on: ${label}`);
  console.log(`========================================`);

  const conn = await mongoose.createConnection(dbUri).asPromise();
  console.log(`✅ Connected to DB: ${conn.name}`);

  const vaultCol = conn.collection('vaultitems');
  const feedCol = conn.collection('feeditems');

  // 1. Migrate VaultItems
  const vaultCursor = vaultCol.find({});
  let vaultUpdated = 0;
  while (await vaultCursor.hasNext()) {
    const doc = await vaultCursor.next();
    const cat = doc.cat || deriveCategory(doc.topic);
    const tags = (Array.isArray(doc.tags) && doc.tags.length > 0)
      ? doc.tags.map(t => (t.startsWith('#') ? t : `#${t}`))
      : deriveHashtags(doc.topic, cat);

    await vaultCol.updateOne(
      { _id: doc._id },
      {
        $set: {
          cat: cat,
          tags: tags,
        },
      }
    );
    vaultUpdated++;
  }
  console.log(`📌 Updated ${vaultUpdated} VaultItem documents with tags & cat.`);

  // 2. Migrate FeedItems
  const feedCursor = feedCol.find({});
  let feedUpdated = 0;
  while (await feedCursor.hasNext()) {
    const doc = await feedCursor.next();
    const cat = doc.cat || deriveCategory(doc.topic);
    const tags = (Array.isArray(doc.tags) && doc.tags.length > 0)
      ? doc.tags.map(t => (t.startsWith('#') ? t : `#${t}`))
      : deriveHashtags(doc.topic, cat);

    await feedCol.updateOne(
      { _id: doc._id },
      {
        $set: {
          cat: cat,
          tags: tags,
        },
      }
    );
    feedUpdated++;
  }
  console.log(`⚡ Updated ${feedUpdated} FeedItem documents with tags & cat.`);

  // Verify by printing a sample document
  const sample = await vaultCol.findOne({});
  console.log(`\n📄 Sample Verified Vault Document in ${conn.name}:`);
  console.log(JSON.stringify(sample, null, 2));

  await conn.close();
}

async function run() {
  const baseUri = process.env.MONGO_URI;
  if (!baseUri) {
    console.error('❌ MONGO_URI missing from environment.');
    process.exit(1);
  }

  // Migrate 'test' database (default connection)
  await migrateDatabase(baseUri, 'Default Database (test)');

  // Also migrate 'mindvault' database if present
  if (baseUri.includes('.mongodb.net/?') || baseUri.includes('.mongodb.net/')) {
    const mindvaultUri = baseUri.includes('.mongodb.net/?')
      ? baseUri.replace('.mongodb.net/?', '.mongodb.net/mindvault?')
      : baseUri.replace(/\.mongodb\.net\/[^?]+/, '.mongodb.net/mindvault');
    await migrateDatabase(mindvaultUri, 'Named Database (mindvault)');
  }

  console.log('\n🎉 ALL MongoDB documents now contain `tags` and `cat`!');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Migration error:', err);
  process.exit(1);
});
