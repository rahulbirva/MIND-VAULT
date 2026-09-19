const mongoose = require('mongoose');

const vaultItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
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
      default: '',
    },
    keyFacts: {
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
    masteredAt: {
      type: Date,
      default: null,
    },
    // "saved" = saved from discovery/feed; "mastered" = completed topic; "liked" = favorited post
    sourceType: {
      type: String,
      enum: ['saved', 'mastered', 'liked'],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VaultItem', vaultItemSchema);
