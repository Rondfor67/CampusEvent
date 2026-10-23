
import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    building: {
      type: String,
      required: true,
      trim: true,
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    collection: 'venues',
    timestamps: true,
  }
);

const Venue = mongoose.models.Venue || mongoose.model('Venue', venueSchema);

export default Venue;
