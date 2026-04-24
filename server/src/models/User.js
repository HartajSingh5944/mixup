const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    // GeoJSON stores coordinates as [longitude, latitude].
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      default: '',
      trim: true,
    },
    state: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: '',
      trim: true,
    },
    interests: {
      type: [String],
      default: [],
    },
    location: {
      type: pointSchema,
      default: () => ({ type: 'Point', coordinates: [0, 0] }),
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    ban: {
      isBanned: {
        type: Boolean,
        default: false,
      },
      reason: {
        type: String,
        default: '',
        trim: true,
      },
      bannedAt: {
        type: Date,
      },
    },
  },
  { timestamps: true }
);

// Required for $near and other geospatial queries.
userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
