const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    // MongoDB expects GeoJSON points in [lng, lat] order.
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      enum: ['music', 'sports', 'comedy', 'dance', 'other'],
      default: 'other',
    },
    dateTime: {
      type: Date,
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    priceAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    ticketUrl: {
      type: String,
      default: '',
      trim: true,
    },
    contactNumber: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    maxAttendees: {
      type: Number,
      min: 1,
    },
    bookedSlots: {
      type: Number,
      min: 0,
      default: 0,
    },
    bookingsOpen: {
      type: Boolean,
      default: true,
    },
    participationType: {
      type: String,
      enum: ['individual', 'team'],
      default: 'individual',
    },
    minTeamSize: {
      type: Number,
      min: 1,
      default: 1,
    },
    durationMinutes: {
      type: Number,
      min: 15,
      default: 60,
    },
    ageMin: {
      type: Number,
      min: 0,
      default: 0,
    },
    ageMax: {
      type: Number,
      min: 0,
      default: 99,
    },
    genderPreference: {
      type: String,
      enum: ['any', 'women', 'men', 'non_binary', 'mixed'],
      default: 'any',
    },
    tags: {
      type: [String],
      default: [],
    },
    location: {
      type: pointSchema,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Enables efficient nearby-event lookup through $near.
eventSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Event', eventSchema);
