import mongoose from 'mongoose';

const allowedTeacherSchema = new mongoose.Schema(
  {
    iin: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    full_name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'allowed_teachers',
  }
);

export default mongoose.models.AllowedTeacher ||
  mongoose.model('AllowedTeacher', allowedTeacherSchema);