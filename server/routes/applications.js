
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { Readable } from 'node:stream';

import cloudinary from '../config/cloudinary.js';
import Application from '../models/Application.js';
import Venue from '../models/Venue.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Notification from '../models/Notification.js';

const router = express.Router();

const allowedTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6,
    fields: 20,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Разрешены только JPG, PNG и WebP'));
    }
    cb(null, true);
  },
}).array('images', 6);

function uploadImages(req, res, next) {
  upload(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }
    next();
  });
}

function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'campusevents/events',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) {
          return reject(new Error('Cloudinary не вернул результат'));
        }
        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(stream);
  });
}

async function deleteCloudinaryImages(ids) {
  await Promise.allSettled(
    ids.map((id) =>
      cloudinary.uploader.destroy(id, {
        resource_type: 'image',
      })
    )
  );
}

function isValidCampusTime(start, end) {
  if (
    !(start instanceof Date) ||
    !(end instanceof Date) ||
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    return false;
  }

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Almaty',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = (date) =>
    Object.fromEntries(
      formatter.formatToParts(date).map((part) => [
        part.type,
        part.value,
      ])
    );

  const a = parts(start);
  const b = parts(end);

  return (
    `${a.year}-${a.month}-${a.day}` ===
      `${b.year}-${b.month}-${b.day}` &&
    `${a.hour}:${a.minute}` >= '07:00' &&
    `${a.hour}:${a.minute}` <= '19:00' &&
    `${b.hour}:${b.minute}` > `${a.hour}:${a.minute}` &&
    `${b.hour}:${b.minute}` <= '21:00'
  );
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';

    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Необходимо войти в аккаунт',
      });
    }

    const payload = jwt.verify(
      header.slice(7),
      process.env.JWT_SECRET
    );

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

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Доступ только для администратора',
    });
  }
  next();
}

function requireCreator(req, res, next) {
  if (!['user', 'teacher'].includes(req.user.role)) {
    return res.status(403).json({
      message: 'Недостаточно прав',
    });
  }
  next();
}
//УВЕДОМЛЕНИЯ

async function safelyNotify(action) {
  try {
    await action();
  } catch (error) {
    console.error('Ошибка создания уведомления:', error);
  }
}

async function notifyAdmins(application, isUpdate = false) {
  const admins = await User.find({
    role: 'admin',
  }).select('_id');

  if (!admins.length) return;

  const type = isUpdate
    ? 'application_update_requested'
    : 'application_submitted';

  await Notification.insertMany(
    admins.map((admin) => ({
      recipient: admin._id,
      application: application._id,
      type,
      title: isUpdate
        ? 'Запрос на обновление данных'
        : 'Новая заявка',
      message: isUpdate
        ? `Поступил запрос на изменение мероприятия «${application.title}».`
        : `Поступила новая заявка на мероприятие «${application.title}».`,
    })),
    { ordered: false }
  );
}

async function notifyDecision(application, status) {
  const approved = status === 'approved';
  const isUpdate = application.requestType === 'update';

  const title = approved
    ? isUpdate
      ? 'Изменения одобрены'
      : 'Заявка одобрена'
    : isUpdate
      ? 'Изменения отклонены'
      : 'Заявка отклонена';

  let message;

  if (approved) {
    message = isUpdate
      ? `Изменения мероприятия «${application.title}» одобрены администратором.`
      : `Ваше мероприятие «${application.title}» одобрено и опубликовано.`;
  } else {
    const reason =
      application.rejectionReason || 'Причина не указана';

    message = isUpdate
      ? `Изменения мероприятия «${application.title}» отклонены. Причина: ${reason}`
      : `Заявка на мероприятие «${application.title}» отклонена. Причина: ${reason}`;
  }

  await Notification.updateOne(
    {
      recipient: application.createdBy,
      application: application._id,
      type: 'application_decision',
    },
    {
      $setOnInsert: {
        recipient: application.createdBy,
        application: application._id,
        type: 'application_decision',
        title,
        message,
      },
    },
    { upsert: true }
  );
}

async function notifyEventUpdated(event, application) {
  const registrations = await Registration.find({
    event: event._id,
    status: { $in: ['active', 'used'] },
  }).select('user');

  const recipients = [
    ...new Set(
      registrations.map((entry) => String(entry.user))
    ),
  ];

  if (!recipients.length) return;

  await Notification.insertMany(
    recipients.map((recipient) => ({
      recipient,
      event: event._id,
      application: application._id,
      type: 'event_updated',
      title: 'Данные мероприятия изменены',
      message:
        `Обновлены данные мероприятия «${application.title}». ` +
        'Проверьте актуальные дату, время и место проведения.',
    })),
    { ordered: false }
  );
}

//СОЗДАНИЕ ЗАЯВКИ
//POST /api/applications
router.post(
  '/',
  requireAuth,
  requireCreator,
  uploadImages,
  async (req, res) => {
    let saved = false;
    const uploadedIds = [];

    try {
      const {
        title,
        category,
        description,
        venue,
        startAt,
        endAt,
        capacity,
        phone,
        comment,
      } = req.body;

      if (
        ![title, category, description, phone].every(
          (value) =>
            typeof value === 'string' && value.trim()
        )
      ) {
        return res.status(400).json({
          message: 'Заполни обязательные поля',
        });
      }

      if (!mongoose.isValidObjectId(venue)) {
        return res.status(400).json({
          message: 'Некорректное помещение',
        });
      }

      const place = await Venue.findOne({
        _id: venue,
        isActive: true,
      });

      if (!place) {
        return res.status(404).json({
          message: 'Помещение не найдено',
        });
      }

      const start = new Date(startAt);
      const end = new Date(endAt);
      const number = Number(capacity);

      if (
        start <= new Date() ||
        !isValidCampusTime(start, end)
      ) {
        return res.status(400).json({
          message: 'Некорректные дата и время',
        });
      }

      if (
        !Number.isInteger(number) ||
        number < 1 ||
        number > place.capacity
      ) {
        return res.status(400).json({
          message: 'Некорректное количество мест',
        });
      }

      const conflict = await Event.exists({
        status: { $ne: 'cancelled' },
        venue: place._id,
        startAt: { $lt: end },
        endAt: { $gt: start },
      });

      if (conflict) {
        return res.status(409).json({
          message: 'Помещение занято в выбранное время',
        });
      }

      const images = [];

      for (const file of req.files || []) {
        const result = await uploadToCloudinary(file);
        images.push(result.secure_url);
        uploadedIds.push(result.public_id);
      }

      const application = await Application.create({
        requestType: 'create',
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        venue: place._id,
        startAt: start,
        endAt: end,
        capacity: number,
        phone: phone.trim(),
        comment:
          typeof comment === 'string'
            ? comment.trim()
            : '',
        images,
        createdBy: req.user._id,
        status: 'pending',
      });

      saved = true;

      await safelyNotify(() =>
        notifyAdmins(application, false)
      );

      return res.status(201).json({
        message: 'Заявка отправлена администратору',
        application,
      });
    } catch (error) {
      console.error('Ошибка создания заявки:', error);

      return res.status(500).json({
        message: 'Не удалось создать заявку',
      });
    } finally {
      if (!saved && uploadedIds.length) {
        await deleteCloudinaryImages(uploadedIds);
      }
    }
  }
);

//ЗАПРОС НА РЕДАКТИРОВАНИЕ

router.post(
  '/:id/request-update',
  requireAuth,
  requireCreator,
  uploadImages,
  async (req, res) => {
    const uploadedIds = [];
    let saved = false;

    try {
      const original = await Application.findOne({
        _id: mongoose.isValidObjectId(req.params.id)
          ? req.params.id
          : null,
        createdBy: req.user._id,
        status: 'approved',
        requestType: { $ne: 'update' },
      });

      if (!original) {
        return res.status(404).json({
          message: 'Одобренная заявка не найдена',
        });
      }

      const event = await Event.findOne({
        application: original._id,
        status: { $ne: 'cancelled' },
      });

      if (!event) {
        return res.status(404).json({
          message: 'Мероприятие не найдено или отменено',
        });
      }

      if (event.startAt <= new Date()) {
        return res.status(409).json({
          message: 'Начавшееся мероприятие нельзя изменять',
        });
      }

      const existing = await Application.exists({
        requestType: 'update',
        targetEvent: event._id,
        status: 'pending',
      });

      if (existing) {
        return res.status(409).json({
          message: 'Запрос на изменение уже рассматривается',
        });
      }

      const {
        title,
        category,
        description,
        venue,
        startAt,
        endAt,
        capacity,
        phone,
        comment,
      } = req.body;

      if (
        ![title, category, description, phone].every(
          (value) =>
            typeof value === 'string' && value.trim()
        )
      ) {
        return res.status(400).json({
          message: 'Заполни обязательные поля',
        });
      }

      if (!mongoose.isValidObjectId(venue)) {
        return res.status(400).json({
          message: 'Некорректное помещение',
        });
      }

      const place = await Venue.findOne({
        _id: venue,
        isActive: true,
      });

      if (!place) {
        return res.status(400).json({
          message: 'Помещение недоступно',
        });
      }

      const start = new Date(startAt);
      const end = new Date(endAt);
      const number = Number(capacity);

      if (
        start <= new Date() ||
        !isValidCampusTime(start, end)
      ) {
        return res.status(400).json({
          message: 'Некорректная дата или время',
        });
      }

      if (
        !Number.isInteger(number) ||
        number < Math.max(1, event.registeredCount || 0) ||
        number > place.capacity
      ) {
        return res.status(400).json({
          message: 'Некорректное количество мест',
        });
      }

      const conflict = await Event.exists({
        _id: { $ne: event._id },
        status: { $ne: 'cancelled' },
        venue: place._id,
        startAt: { $lt: end },
        endAt: { $gt: start },
      });

      if (conflict) {
        return res.status(409).json({
          message: 'Помещение занято',
        });
      }

      const images = [];

      for (const file of req.files || []) {
        const result = await uploadToCloudinary(file);
        images.push(result.secure_url);
        uploadedIds.push(result.public_id);
      }

      const application = await Application.create({
        requestType: 'update',
        targetEvent: event._id,
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        venue: place._id,
        startAt: start,
        endAt: end,
        capacity: number,
        phone: phone.trim(),
        comment:
          typeof comment === 'string'
            ? comment.trim()
            : '',
        images: images.length
          ? images
          : original.images,
        createdBy: req.user._id,
        status: 'pending',
      });

      saved = true;

      await safelyNotify(() =>
        notifyAdmins(application, true)
      );

      return res.status(201).json({
        message: 'Изменения отправлены администратору',
        application,
      });
    } catch (error) {
      console.error('Ошибка редактирования:', error);

      return res.status(500).json({
        message: 'Не удалось отправить изменения',
      });
    } finally {
      if (!saved && uploadedIds.length) {
        await deleteCloudinaryImages(uploadedIds);
      }
    }
  }
);

//МОИ ЗАЯВКИ
router.get('/my', requireAuth, async (req, res) => {
  try {
    const applications = await Application.find({
      createdBy: req.user._id,
    })
      .populate('venue', 'name building')
      .sort({ createdAt: -1 })
      .lean();

    const originalIds = applications
      .filter((a) => a.requestType !== 'update')
      .map((a) => a._id);

    const targetIds = applications
      .filter(
        (a) =>
          a.requestType === 'update' && a.targetEvent
      )
      .map((a) => a.targetEvent);

    const events = await Event.find({
      $or: [
        { application: { $in: originalIds } },
        { _id: { $in: targetIds } },
      ],
    })
      .select('application status')
      .lean();

    const statusByApplication = new Map();
    const statusByEvent = new Map();

    for (const event of events) {
      if (event.application) {
        statusByApplication.set(
          String(event.application),
          event.status
        );
      }

      statusByEvent.set(
        String(event._id),
        event.status
      );
    }

    const visible = applications
      .map((application) => ({
        ...application,
        eventStatus:
          application.requestType === 'update'
            ? statusByEvent.get(
                String(application.targetEvent)
              ) ?? null
            : statusByApplication.get(
                String(application._id)
              ) ?? null,
      }))
      .filter(
        (application) =>
          application.eventStatus !== 'cancelled'
      );

    return res.json(visible);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Не удалось загрузить заявки',
    });
  }
});

// ЗАЯВКИ АДМИНИСТРАТОРА


router.get(
  '/',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const filter = {};

      if (req.query.status) {
        if (
          !['pending', 'approved', 'rejected'].includes(
            req.query.status
          )
        ) {
          return res.status(400).json({
            message: 'Некорректный статус',
          });
        }

        filter.status = req.query.status;
      }

      const applications = await Application.find(filter)
        .populate('venue', 'name building capacity')
        .populate('createdBy', 'full_name email role')
        .sort({ createdAt: -1 });

      return res.json(applications);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: 'Не удалось загрузить заявки',
      });
    }
  }
);

//ОДОБРЕНИЕ И ОТКЛОНЕНИЕ

router.patch(
  '/:id/status',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, rejectionReason } = req.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: 'Некорректный ID заявки',
        });
      }

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          message: 'Некорректное решение',
        });
      }

      const application = await Application.findById(id);

      if (!application) {
        return res.status(404).json({
          message: 'Заявка не найдена',
        });
      }

      if (application.status !== 'pending') {
        return res.status(409).json({
          message: 'Заявка уже обработана',
        });
      }

      //ОТКЛОНЕНИЕ
      if (status === 'rejected') {
        if (
          typeof rejectionReason !== 'string' ||
          !rejectionReason.trim()
        ) {
          return res.status(400).json({
            message: 'Укажи причину отклонения',
          });
        }

        const updated = await Application.findOneAndUpdate(
          { _id: id, status: 'pending' },
          {
            $set: {
              status: 'rejected',
              rejectionReason: rejectionReason.trim(),
            },
          },
          { new: true }
        );

        if (!updated) {
          return res.status(409).json({
            message: 'Заявка уже обработана',
          });
        }

        await safelyNotify(() =>
          notifyDecision(updated, 'rejected')
        );

        return res.json({
          message: 'Заявка отклонена',
          application: updated,
        });
      }

      //ОДОБРЕНИЕ ОБНОВЛЕНИЯ
      if (application.requestType === 'update') {
        const venue = await Venue.findOne({
          _id: application.venue,
          isActive: true,
        });

        if (
          !venue ||
          application.startAt <= new Date() ||
          !isValidCampusTime(
            application.startAt,
            application.endAt
          ) ||
          application.capacity > venue.capacity
        ) {
          return res.status(400).json({
            message: 'Некорректное время или помещение',
          });
        }

        const event = await Event.findOne({
          _id: application.targetEvent,
          status: { $ne: 'cancelled' },
        });

        if (!event || event.startAt <= new Date()) {
          return res.status(409).json({
            message: 'Мероприятие отменено или уже началось',
          });
        }

        if (
          application.capacity <
          (event.registeredCount || 0)
        ) {
          return res.status(409).json({
            message: 'Мест меньше количества участников',
          });
        }

        const conflict = await Event.exists({
          _id: { $ne: event._id },
          status: { $ne: 'cancelled' },
          venue: application.venue,
          startAt: { $lt: application.endAt },
          endAt: { $gt: application.startAt },
        });

        if (conflict) {
          return res.status(409).json({
            message: 'Помещение занято',
          });
        }

        const session = await mongoose.startSession();

        try {
          await session.withTransaction(async () => {
            const changed =
              await Application.findOneAndUpdate(
                { _id: id, status: 'pending' },
                {
                  $set: {
                    status: 'approved',
                    rejectionReason: '',
                  },
                },
                { new: true, session }
              );

            if (!changed) {
              const error = new Error(
                'Заявка уже обработана'
              );
              error.status = 409;
              throw error;
            }

            const result = await Event.updateOne(
              {
                _id: event._id,
                status: { $ne: 'cancelled' },
              },
              {
                $set: {
                  title: application.title,
                  category: application.category,
                  description: application.description,
                  venue: application.venue,
                  startAt: application.startAt,
                  endAt: application.endAt,
                  capacity: application.capacity,
                  phone: application.phone,
                  images: application.images,
                },
              },
              { session }
            );

            if (!result.matchedCount) {
              const error = new Error(
                'Мероприятие недоступно'
              );
              error.status = 409;
              throw error;
            }

            await Application.updateOne(
              { _id: event.application },
              {
                $set: {
                  title: application.title,
                  category: application.category,
                  description: application.description,
                  venue: application.venue,
                  startAt: application.startAt,
                  endAt: application.endAt,
                  capacity: application.capacity,
                  phone: application.phone,
                  images: application.images,
                  comment: application.comment,
                },
              },
              { session }
            );
          });
        } finally {
          await session.endSession();
        }

        const updatedApplication =
          await Application.findById(id);

        await safelyNotify(() =>
          notifyDecision(updatedApplication, 'approved')
        );

        await safelyNotify(() =>
          notifyEventUpdated(event, application)
        );

        return res.json({
          message: 'Данные мероприятия обновлены',
          applicationId: id,
          eventId: event._id,
        });
      }

      // ОДОБРЕНИЕ НОВОГО МЕРОПРИЯТИЯ
      const venue = await Venue.findOne({
        _id: application.venue,
        isActive: true,
      });

      if (!venue) {
        return res.status(400).json({
          message: 'Помещение недоступно',
        });
      }

      if (
        application.startAt <= new Date() ||
        !isValidCampusTime(
          application.startAt,
          application.endAt
        ) ||
        application.capacity < 1 ||
        application.capacity > venue.capacity
      ) {
        return res.status(400).json({
          message: 'Некорректное время или вместимость',
        });
      }

      const conflict = await Event.exists({
        status: { $ne: 'cancelled' },
        venue: application.venue,
        startAt: { $lt: application.endAt },
        endAt: { $gt: application.startAt },
      });

      if (conflict) {
        return res.status(409).json({
          message: 'Помещение занято в выбранное время',
        });
      }

      const updated = await Application.findOneAndUpdate(
        { _id: id, status: 'pending' },
        {
          $set: {
            status: 'approved',
            rejectionReason: '',
          },
        },
        { new: true }
      );

      if (!updated) {
        return res.status(409).json({
          message: 'Заявка уже обработана',
        });
      }

      let event;

      try {
        event = await Event.create({
          title: updated.title,
          category: updated.category,
          description: updated.description,
          venue: updated.venue,
          startAt: updated.startAt,
          endAt: updated.endAt,
          capacity: updated.capacity,
          registeredCount: 0,
          phone: updated.phone,
          images: updated.images || [],
          organizer: updated.createdBy,
          application: updated._id,
        });
      } catch (error) {
        await Application.updateOne(
          { _id: id, status: 'approved' },
          { $set: { status: 'pending' } }
        );

        throw error;
      }

      await safelyNotify(() =>
        notifyDecision(updated, 'approved')
      );

      return res.json({
        message: 'Заявка одобрена, мероприятие опубликовано',
        application: updated,
        event,
      });
    } catch (error) {
      console.error('Ошибка обработки заявки:', error);

      return res.status(error.status || 500).json({
        message: error.status
          ? error.message
          : 'Не удалось обработать заявку',
      });
    }
  }
);

export default router;
