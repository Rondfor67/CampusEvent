
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';

import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import User from '../models/User.js';

const router = express.Router();

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';

    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Войди в аккаунт, чтобы продолжить',
      });
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.id);

    if (!user) {
      return res.status(401).json({
        message: 'Пользователь не найден',
      });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      message: 'Недействительная авторизация',
    });
  }
}


function requireParticipant(req, res, next) {
  if (!['user', 'teacher'].includes(req.user.role)) {
    return res.status(403).json({
      message: 'Записываться могут только студенты и преподаватели',
    });
  }

  next();
}


function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Доступ только для администратора',
    });
  }

  next();
}

//GET /api/registrations/my
//Билеты текущего юзера
router.get('/my', requireAuth, requireParticipant, async (req, res) => {
  try {
    const registrations = await Registration.find({
      user: req.user._id,
      status: { $ne: 'cancelled' },
    })
      .populate({
        path: 'event',
        select: 'title category description startAt endAt venue capacity',
        populate: {
          path: 'venue',
          select: 'name building',
        },
      })
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    console.error('Ошибка загрузки билетов:', error);

    res.status(500).json({
      message: 'Не удалось загрузить билеты',
    });
  }
});

//GET /api/registrations/event/:eventId
//Участники конкретного мероприятия 
router.get(
  '/event/:eventId',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { eventId } = req.params;

      if (!mongoose.isValidObjectId(eventId)) {
        return res.status(400).json({
          message: 'Некорректный ID мероприятия',
        });
      }

      const event = await Event.findById(eventId);

      if (!event) {
        return res.status(404).json({
          message: 'Мероприятие не найдено',
        });
      }

      const registrations = await Registration.find({
        event: eventId,
        status: { $ne: 'cancelled' },
      })
        .populate('user', 'full_name email')
        .sort({ createdAt: 1 });

      res.json(
        registrations.map((registration) => ({
          id: registration._id,
          full_name: registration.user?.full_name || 'Не указано',
          email: registration.user?.email || '',
          registeredAt: registration.createdAt,
          status: registration.status,
        }))
      );
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);

      res.status(500).json({
        message: 'Не удалось загрузить участников',
      });
    }
  }
);

//POST /api/registrations
//Запись студента на мероприятие
router.post('/', requireAuth, requireParticipant, async (req, res) => {
  const { eventId } = req.body;

  if (!mongoose.isValidObjectId(eventId)) {
    return res.status(400).json({
      message: 'Некорректный ID мероприятия',
    });
  }

  const session = await mongoose.startSession();

  try {
    let registration = null;

    await session.withTransaction(async () => {
      const event = await Event.findById(eventId).session(session);

      if (!event) {
        const error = new Error('Мероприятие не найдено');
        error.status = 404;
        throw error;
      }
      
      if (event.status === 'cancelled') {
        const error = new Error(
          'Регистрация невозможна: мероприятие отменено'
        );
        error.status = 409;
        throw error;
      }


      if (event.startAt <= new Date()) {
        const error = new Error(
          'Регистрация на это мероприятие уже закрыта'
        );
        error.status = 400;
        throw error;
      }

      const existing = await Registration.findOne({
        user: req.user._id,
        event: event._id,
      }).session(session);

      if (existing) {
        const error = new Error(
          'Ты уже записана на это мероприятие'
        );
        error.status = 409;
        throw error;
      }

      //Увеличиваем счётчик только при наличии свободных мест
      const updatedEvent = await Event.findOneAndUpdate(
        {
          _id: event._id,
          registeredCount: { $lt: event.capacity },
          status: { $ne: 'cancelled' },
        },
        { $inc: { registeredCount: 1 } },
        { new: true, session }
      );

      if (!updatedEvent) {
        const error = new Error(
          'К сожалению, свободных мест больше нет'
        );
        error.status = 409;
        throw error;
      }

      const created = await Registration.create(
        [
          {
            user: req.user._id,
            event: event._id,
            ticketCode: randomUUID(),
            status: 'active',
          },
        ],
        { session }
      );

      registration = created[0];
    });

    return res.status(201).json({
      message: 'Ты успешно записана на мероприятие',
      registration,
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Ты уже записана на это мероприятие',
      });
    }

    if (error.hasErrorLabel?.('TransientTransactionError')) {
      return res.status(409).json({
        message: 'Данные обновились. Попробуй записаться ещё раз.',
      });
    }

    return res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : 'Не удалось записаться на мероприятие',
    });
  } finally {
    await session.endSession();
  }
});


//GET /api/registrations/ticket/:code
//Проверка настоящего билета по qr code
router.get('/ticket/:code', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Проверять билеты может только администратор',
      });
    }

    const registration = await Registration.findOne({
      ticketCode: req.params.code,
    })
      .populate('user', 'full_name email')
      .populate({
        path: 'event',
        select: 'title startAt endAt venue',
        populate: {
          path: 'venue',
          select: 'name building',
        },
      });

    if (!registration) {
      return res.status(404).json({
        message: 'Билет не найден в базе данных',
      });
    }

    return res.json({
      id: registration._id,
      ticketCode: registration.ticketCode,

      studentName:
        registration.user?.full_name || 'Не указано',
      email:
        registration.user?.email || 'Не указан',

      eventTitle:
        registration.event?.title || 'Не указано',
      eventDate:
        registration.event?.startAt || null,
      location:
        registration.event?.venue?.name || 'Не указано',

      registeredAt: registration.createdAt,
      status: registration.status,
      valid: registration.status === 'active',
    });
  } catch (error) {
    console.error('Ошибка проверки билета:', error);

    return res.status(500).json({
      message: 'Не удалось проверить билет',
    });
  }
});
//GET /api/registrations/my/cancelled-notices
//Отменённые билеты текущего пользователя
router.get(
  '/my/cancelled-notices',
  requireAuth,
  requireParticipant,
  async (req, res) => {
    try {
      const registrations = await Registration.find({
        user: req.user._id,
        status: 'cancelled',
      })
        .populate({
          path: 'event',
          select: 'title cancelledAt status startAt',
        })
        .sort({ updatedAt: -1 });

      const result = registrations
        .filter((registration) => registration.event)
        .map((registration) => ({
          id: registration._id,
          ticketCode: registration.ticketCode,
          eventId: registration.event._id,
          title: registration.event.title,
          cancelledAt: registration.event.cancelledAt || registration.updatedAt,
          message: `Ваш билет на мероприятие «${registration.event.title}» аннулирован, потому что мероприятие было отменено.`,
        }));

      return res.json(result);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений об отмене:', error);
      return res.status(500).json({
        message: 'Не удалось загрузить уведомления об отмене',
      });
    }
  }
);
export default router;
