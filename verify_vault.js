const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, 'Backend/.env') });
dotenv.config();

const VaultItem = require('./Backend/src/models/VaultItem');
const User = require('./Backend/src/models/User');
const FeedItem = require('./Backend/src/models/FeedItem');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne();
  if (!user) {
    console.log('No user in database');
    process.exit(0);
  }
  console.log('Test User:', user.username, 'ID:', user._id.toString());
  
  // Check if any vault items exist
  let items = await VaultItem.find({ userId: user._id });
  console.log('Current Vault items for user:', items.length);

  // If no vault items exist, let's create or check a saved feed item
  if (items.length === 0) {
    const feedItem = await FeedItem.findOne();
    if (feedItem) {
      console.log('Found FeedItem to test saving:', feedItem.topic);
      const created = await VaultItem.create({
        userId: user._id,
        topic: feedItem.topic,
        body: feedItem.body || feedItem.summary,
        summary: feedItem.summary || feedItem.body,
        keyFacts: feedItem.keyPoints || [],
        sourceType: 'saved',
      });
      console.log('Created test VaultItem:', created._id.toString());
      items = [created];
    }
  }

  items.forEach((item, i) => {
    console.log(`\n--- Item [${i + 1}] ---`);
    console.log('Topic (Title):', item.topic);
    console.log('SourceType:', item.sourceType);
    console.log('Body length:', (item.body || '').length, 'chars');
    console.log('Summary length:', (item.summary || '').length, 'chars');
    console.log('KeyFacts count:', (item.keyFacts || []).length);
  });

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
