import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
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

    phone: {
      type: String,
      required: true,
    },

    comment: {
      type: String,
      default: '',
    },

    // Первая фотография — обложка
    images: {
      type: [String],
      default: [],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    rejectionReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'applications',
  }
);

applicationSchema.index({
  venue: 1,
  startAt: 1,
  endAt: 1,
});

export default mongoose.models.Application ||
  mongoose.model('Application', applicationSchema);