import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    iin: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },

    full_name: {
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

    password_hash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

export default mongoose.model('User', userSchema);