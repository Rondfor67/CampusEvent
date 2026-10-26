import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  type: { type: String, enum: ['event_cancelled'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  readAt: { type: Date, default: null },
  shownAt: { type: Date, default: null },
}, { timestamps: true, collection: 'notifications' });

notificationSchema.index({ recipient: 1, event: 1, type: 1 }, { unique: true });
export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
