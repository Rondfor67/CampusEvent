
import mongoose from 'mongoose';

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },

    application: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      default: null,
    },

    type: {
      type: String,
      enum: [
        'event_cancelled',
        'event_updated',
        'application_submitted',
        'application_update_requested',
        'application_decision',
        'registration_created',
        'registration_cancelled',
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    shownAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'notifications',
  }
);

// Не создаём повторное уведомление об отмене
// одного мероприятия для одного человека.
notificationSchema.index(
  { recipient: 1, event: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: 'event_cancelled',
    },
  }
);

// Одно уведомление о решении по конкретной заявке.
notificationSchema.index(
  { recipient: 1, application: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: 'application_decision',
    },
  }
);

export default mongoose.models.Notification ||
  mongoose.model('Notification', notificationSchema);
