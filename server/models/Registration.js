
import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },

    ticketCode: {
      type: String,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ['active', 'used', 'cancelled'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    collection: 'registrations',
  }
);

//один студент одна регистрация на мероприятие
registrationSchema.index(
  { user: 1, event: 1 },
  { unique: true }
);

export default mongoose.models.Registration ||
  mongoose.model('Registration', registrationSchema);
