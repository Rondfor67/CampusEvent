import mongoose from 'mongoose';

const allowedStudentSchema = new mongoose.Schema(
  {
    iin: {
      type: String,
      required: true,
      unique: true,
      match: /^\d{12}$/,
    },

    full_name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'allowed_students',
  }
);

export default mongoose.model('AllowedStudent', allowedStudentSchema);