const mongoose = require('mongoose');

const feedItemSchema = new mongoose.Schema(
  {
    // null for discovery items not tied to a specific user session
    userId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    cat: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    body: {
      type: String,
      default: '',
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
    imageUrl: {
      type: String,
      default: null,
    },
    source: {
      type: String,
      enum: ['interest', 'discovery'],
      required: true,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    seenAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FeedItem', feedItemSchema);
