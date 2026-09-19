const mongoose = require('mongoose');

const reelItemSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    caption: {
      type: String,
      default: '',
      trim: true,
    },
    video_prompt: {
      type: String,
      default: '',
    },
    negative_prompt: {
      type: String,
      default: '',
    },
    videoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    duration: {
      type: Number,
      default: 5.0,
    },
    aspectRatio: {
      type: String,
      default: '9:16',
    },
    resolution: {
      type: String,
      default: '720x1280',
    },
    model: {
      type: String,
      default: 'Wan 2.2 (Q6_K GGUF)',
    },
    likes_count: {
      type: Number,
      default: 0,
    },
    views_count: {
      type: Number,
      default: 0,
    },
    liked_by: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'reels', // maps explicitly to 'reels' collection in MongoDB
  }
);

// Virtual for backward-compatibility if code checks .prompt
reelItemSchema.virtual('prompt').get(function () {
  return this.video_prompt;
});

module.exports = mongoose.model('ReelItem', reelItemSchema);
