
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    iin: {
      type: String,
      required: function () {
        return this.role !== 'admin';
      },
      unique: true,
      sparse: true,
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

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    password_hash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ['user', 'teacher', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

export default mongoose.models.User ||
  mongoose.model('User', userSchema);
