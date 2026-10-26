
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

import Event from '../models/Event.js';
import User from '../models/User.js';
import Registration from '../models/Registration.js';
import Notification from '../models/Notification.js';

const router = express.Router();

//GET /api/events
//Все активные мероприятия

router.get('/', async (req, res) => {
  try {
    const events = await Event.find({
      status: { $ne: 'cancelled' }
    })
      .populate('venue', 'name building capacity')
      .sort({ startAt: 1 })
      .lean();

    const result = events.map((event) => ({
      ...event,
      id: event._id.toString(),
      date: event.startAt,
      event_date: event.startAt,

      location: event.venue
        ? `${event.venue.name}, ${event.venue.building}`
        : 'Не указано',

      availableSeats: Math.max(
        0,
        event.capacity - (event.registeredCount || 0)
      ),

      images: Array.isArray(event.images)
        ? event.images
        : []
    }));

    return res.json(result);
  } catch (error) {
    console.error('Ошибка получения мероприятий:', error);

    return res.status(500).json({
      message: 'Не удалось загрузить мероприятия'
    });
  }
});

//GET /api/events/cancelled
//Отменённые мероприятия


router.get('/cancelled', async (req, res) => {
  try {
    const events = await Event.find({
      status: 'cancelled'
    })
      .select('title cancelledAt')
      .sort({ cancelledAt: -1 })
      .limit(10)
      .lean();

    return res.json(events);
  } catch (error) {
    console.error('Ошибка загрузки отмен:', error);

    return res.status(500).json({
      message: 'Не удалось загрузить отменённые мероприятия'
    });
  }
});

//GET /api/events/:id
//Одно активное мероприятие

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: 'Некорректный ID мероприятия'
      });
    }

    const event = await Event.findById(id)
      .populate('venue', 'name building capacity')
      .lean();

    if (!event) {
      return res.status(404).json({
        message: 'Мероприятие не найдено'
      });
    }

    if (event.status === 'cancelled') {
      return res.status(404).json({
        message: 'Это мероприятие отменено'
      });
    }

    return res.json({
      ...event,
      id: event._id.toString(),
      date: event.startAt,
      event_date: event.startAt,

      location: event.venue
        ? `${event.venue.name}, ${event.venue.building}`
        : 'Не указано',

      availableSeats: Math.max(
        0,
        event.capacity - (event.registeredCount || 0)
      ),

      images: Array.isArray(event.images)
        ? event.images
        : []
    });
  } catch (error) {
    console.error('Ошибка получения мероприятия:', error);

    return res.status(500).json({
      message: 'Не удалось загрузить мероприятие'
    });
  }
});

//PATCH /api/events/:id/cancel
//Отмена мероприятия администратором

router.patch('/:id/cancel', async (req, res) => {
  try {
    // Проверка авторизации
    const header = req.headers.authorization || '';

    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Необходима авторизация'
      });
    }

    let payload;

    try {
      payload = jwt.verify(
        header.slice(7),
        process.env.JWT_SECRET
      );
    } catch {
      return res.status(401).json({
        message: 'Недействительный токен'
      });
    }

    const user = await User.findById(payload.id);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        message: 'Доступ только для администратора'
      });
    }

    //Проверка ID
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Некорректный ID мероприятия'
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: 'Мероприятие не найдено'
      });
    }

    if (event.status === 'cancelled') {
      return res.status(409).json({
        message: 'Мероприятие уже отменено'
      });
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        //Отменяем мероприятие
        const updated = await Event.findOneAndUpdate(
          {
            _id: event._id,
            status: { $ne: 'cancelled' }
          },
          {
            $set: {
              status: 'cancelled',
              cancelledAt: new Date()
            }
          },
          { new: true, session }
        );

        if (!updated) {
          const error = new Error(
            'Мероприятие уже отменено'
          );
          error.status = 409;
          throw error;
        }

        //Находим получателей уведомлений
        const recipients = await Registration.distinct(
          'user',
          {
            event: event._id,
            status: { $in: ['active', 'used'] }
          }
        ).session(session);

        //Аннулируем билеты
        await Registration.updateMany(
          { event: event._id },
          { $set: { status: 'cancelled' } },
          { session }
        );

        //Создаём уведомления
        if (recipients.length > 0) {
          await Notification.bulkWrite(
            recipients.map((recipient) => ({
              updateOne: {
                filter: {
                  recipient,
                  event: event._id,
                  type: 'event_cancelled'
                },
                update: {
                  $setOnInsert: {
                    recipient,
                    event: event._id,
                    type: 'event_cancelled',
                    title: 'Мероприятие отменено',
                    message:
                      `Мероприятие «${event.title}» отменено. ` +
                      'Ваш билет аннулирован.'
                  }
                },
                upsert: true
              }
            })),
            { session, ordered: false }
          );
        }
      });
    } finally {
      await session.endSession();
    }

    return res.json({
      message:
        'Мероприятие отменено, билеты аннулированы, уведомления созданы'
    });

  } catch (error) {
    console.error('Ошибка отмены мероприятия:', error);

    return res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : 'Не удалось отменить мероприятие'
    });
  }
});

export default router;
