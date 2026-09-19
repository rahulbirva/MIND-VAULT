const mongoose = require('mongoose');

const vaultItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
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
    // "saved" = saved from discovery/feed; "mastered" = passed quiz
    sourceType: {
      type: String,
      enum: ['saved', 'mastered'],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VaultItem', vaultItemSchema);
