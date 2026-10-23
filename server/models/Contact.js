
import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ['new', 'read', 'resolved'],
      default: 'new',
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'contacts',
  }
);

export default mongoose.models.Contact ||
  mongoose.model('Contact', contactSchema);
