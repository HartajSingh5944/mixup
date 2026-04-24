const mongoose = require('mongoose');

const transcriptMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    createdAt: {
      type: Date,
      required: true,
    },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
    },
    category: {
      type: String,
      enum: ['harassment', 'spam', 'hate_speech', 'scam', 'threat', 'sexual_content', 'other'],
      required: true,
    },
    details: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['open', 'reviewing', 'actioned', 'dismissed'],
      default: 'open',
      index: true,
    },
    actionTaken: {
      type: String,
      enum: ['none', 'warned', 'banned'],
      default: 'none',
    },
    resolutionNotes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    transcriptSnapshot: {
      type: [transcriptMessageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

reportSchema.index({ reportedUser: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
