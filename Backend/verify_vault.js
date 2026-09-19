const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const VaultItem = require('./src/models/VaultItem');
const User = require('./src/models/User');
const FeedItem = require('./src/models/FeedItem');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/mindvault');
  const user = await User.findOne();
  if (!user) {
    console.log('No user in database');
    process.exit(0);
  }
  console.log('Test User:', user.username, 'ID:', user._id.toString());
  
  let items = await VaultItem.find({ userId: user._id });
  console.log('Current Vault items for user:', items.length);

  if (items.length === 0) {
    const feedItem = await FeedItem.findOne();
    if (feedItem) {
      console.log('Creating sample vault item from FeedItem:', feedItem.topic);
      const created = await VaultItem.create({
        userId: user._id,
        topic: feedItem.topic,
        body: feedItem.body || feedItem.summary,
        summary: feedItem.summary || feedItem.body,
        keyFacts: feedItem.keyPoints || [],
        sourceType: 'saved',
      });
      items = [created];
    }
  }

  items.forEach((item, i) => {
    console.log(`\n--- Vault Item [${i + 1}] ---`);
    console.log('Topic (Title):', item.topic);
    console.log('SourceType:', item.sourceType);
    console.log('Body characters:', (item.body || '').length);
    console.log('Summary characters:', (item.summary || '').length);
    console.log('Key facts count:', (item.keyFacts || []).length);
  });

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
