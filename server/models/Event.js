import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: true,
    },

    startAt: {
      type: Date,
      required: true,
    },

    endAt: {
      type: Date,
      required: true,
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
    },

    registeredCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    status: {
      type: String,
      enum: ['published', 'cancelled'],
      default: 'published',
    },

    cancelledAt: {
      type: Date,
      default: null,
    },


    phone: {
      type: String,
      required: true,
    },

    // Первая фотография — обложка,
    // остальные — галерея
    images: {
      type: [String],
      default: [],
    },

    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    collection: 'events',
  }
);

eventSchema.index({
  venue: 1,
  startAt: 1,
  endAt: 1,
});

export default mongoose.models.Event ||
  mongoose.model('Event', eventSchema);