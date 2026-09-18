const mongoose = require('mongoose');

const feedItemSchema = new mongoose.Schema(
  {
    // null for discovery items not tied to a specific user session
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
    },
    keyPoints: {
      type: [String],
      default: [],
    },
    videoUrl: {
      type: String,
      default: null,
    },
    source: {
      type: String,
      enum: ['interest', 'discovery'],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FeedItem', feedItemSchema);
