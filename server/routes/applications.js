
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

const router = express.Router();

// ========================================
// ЗАГРУЗКА ФОТОГРАФИЙ В CLOUDINARY
// ========================================

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
      return cb(
        new Error('Разрешены только JPG, PNG и WebP')
      );
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
        if (error) {
          return reject(error);
        }

        if (!result) {
          return reject(
            new Error('Cloudinary не вернул результат загрузки')
          );
        }

        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(stream);
  });
}

async function deleteCloudinaryImages(publicIds) {
  await Promise.allSettled(
    publicIds.map((publicId) =>
      cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
      })
    )
  );
}

// ========================================
// ПРОВЕРКА ВРЕМЕНИ ПО АСТАНЕ
// ========================================

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

  function getParts(date) {
    const parts = Object.fromEntries(
      formatter.formatToParts(date).map((part) => [
        part.type,
        part.value,
      ])
    );

    return {
      date: `${parts.year}-${parts.month}-${parts.day}`,
      time: `${parts.hour}:${parts.minute}`,
    };
  }

  const startLocal = getParts(start);
  const endLocal = getParts(end);

  return (
    startLocal.date === endLocal.date &&
    startLocal.time >= '07:00' &&
    startLocal.time <= '19:00' &&
    endLocal.time > startLocal.time &&
    endLocal.time <= '21:00'
  );
}

// ========================================
// ПРОВЕРКА АВТОРИЗАЦИИ
// ========================================

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';

    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Необходимо войти в аккаунт',
      });
    }

    const token = header.slice(7);

    const payload = jwt.verify(
      token,
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

// ========================================
// ПРОВЕРКА РОЛЕЙ
// ========================================

// Только администратор
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Доступ разрешён только администратору',
    });
  }

  next();
}

// Студенты и преподаватели
function requireCreator(req, res, next) {
  if (!['user', 'teacher'].includes(req.user.role)) {
    return res.status(403).json({
      message:
        'Создавать заявки могут только студенты и преподаватели',
    });
  }

  next();
}

// ========================================
// POST /api/applications
// СОЗДАНИЕ ЗАЯВКИ
// ========================================

router.post(
  '/',
  requireAuth,
  requireCreator,
  uploadImages,
  async (req, res) => {
    let applicationSaved = false;
    const uploadedPublicIds = [];

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

      // Проверяем обязательные поля
      if (
        typeof title !== 'string' ||
        !title.trim() ||
        typeof category !== 'string' ||
        !category.trim() ||
        typeof description !== 'string' ||
        !description.trim() ||
        typeof phone !== 'string' ||
        !phone.trim()
      ) {
        return res.status(400).json({
          message: 'Заполни все обязательные поля',
        });
      }

      // Проверяем помещение
      if (!mongoose.isValidObjectId(venue)) {
        return res.status(400).json({
          message: 'Выбери корректное помещение',
        });
      }

      const selectedVenue = await Venue.findOne({
        _id: venue,
        isActive: true,
      });

      if (!selectedVenue) {
        return res.status(404).json({
          message: 'Помещение не найдено',
        });
      }

      // Проверяем даты
      const start = new Date(startAt);
      const end = new Date(endAt);

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
      ) {
        return res.status(400).json({
          message: 'Укажи корректные дату и время',
        });
      }

      if (start <= new Date()) {
        return res.status(400).json({
          message: 'Нельзя создать мероприятие в прошлом',
        });
      }

      if (end <= start) {
        return res.status(400).json({
          message:
            'Время окончания должно быть позже начала',
        });
      }

      // Ограничение: с 07:00 до 21:00
      // Начало не позднее 19:00
      if (!isValidCampusTime(start, end)) {
        return res.status(400).json({
          message:
            'Мероприятие должно начинаться с 07:00 до 19:00 ' +
            'и заканчиваться не позднее 21:00 по времени Астаны.',
        });
      }

      // Проверяем вместимость
      const requestedCapacity = Number(capacity);

      if (
        !Number.isInteger(requestedCapacity) ||
        requestedCapacity < 1 ||
        requestedCapacity > selectedVenue.capacity
      ) {
        return res.status(400).json({
          message:
            `Допустимое количество участников: ` +
            `от 1 до ${selectedVenue.capacity}`,
        });
      }

      // Проверяем опубликованные мероприятия
      const eventConflict = await Event.findOne({
        status: { $ne: 'cancelled' },
        venue: selectedVenue._id,
        startAt: { $lt: end },
        endAt: { $gt: start },
      });

      if (eventConflict) {
        return res.status(409).json({
          message:
            'Помещение уже занято в выбранное время',
        });
      }

      // ========================================
      // ЗАГРУЖАЕМ ФОТОГРАФИИ В CLOUDINARY
      // ========================================

      const images = [];

      for (const file of req.files || []) {
        const result = await uploadToCloudinary(file);

        uploadedPublicIds.push(result.public_id);
        images.push(result.secure_url);
      }

      // ========================================
      // СОХРАНЯЕМ ЗАЯВКУ В MONGODB
      // ========================================

      const application = await Application.create({
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        venue: selectedVenue._id,
        startAt: start,
        endAt: end,
        capacity: requestedCapacity,
        phone: phone.trim(),

        comment:
          typeof comment === 'string'
            ? comment.trim()
            : '',

        images,

        createdBy: req.user._id,
        status: 'pending',
      });

      applicationSaved = true;

      return res.status(201).json({
        message:
          'Заявка успешно отправлена администратору',
        application,
      });
    } catch (error) {
      console.error('Ошибка создания заявки:', error);

      return res.status(500).json({
        message: 'Не удалось создать заявку',
      });
    } finally {
      // Если заявку сохранить не удалось,
      // удаляем уже загруженные фотографии
      if (
        !applicationSaved &&
        uploadedPublicIds.length > 0
      ) {
        await deleteCloudinaryImages(uploadedPublicIds);
      }
    }
  }
);

// POST /api/applications/:id/request-update
// Автор создаёт отдельную заявку на изменение опубликованного события.
router.post('/:id/request-update', requireAuth, requireCreator, uploadImages, async (req, res) => {
  const uploadedPublicIds = [];
  let saved = false;
  try {
    const original = await Application.findOne({
      _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null,
      createdBy: req.user._id, status: 'approved',
      requestType: { $ne: 'update' }
    });
    if (!original) return res.status(404).json({ message: 'Ваша одобренная заявка не найдена' });
    const event = await Event.findOne({ application: original._id, status: { $ne: 'cancelled' } });
    if (!event) return res.status(404).json({ message: 'Мероприятие не найдено или отменено' });
    if (event.startAt <= new Date()) return res.status(409).json({ message: 'Нельзя изменять начавшееся мероприятие' });
    const existing = await Application.exists({ requestType: 'update', targetEvent: event._id, status: 'pending' });
    if (existing) return res.status(409).json({ message: 'Запрос на редактирование уже рассматривается' });
    const { title, category, description, venue, startAt, endAt, capacity, phone, comment } = req.body;
    if (![title, category, description, phone].every(v => typeof v === 'string' && v.trim()))
      return res.status(400).json({ message: 'Заполни обязательные поля' });
    if (!mongoose.isValidObjectId(venue)) return res.status(400).json({ message: 'Некорректное помещение' });
    const place = await Venue.findOne({ _id: venue, isActive: true });
    if (!place) return res.status(400).json({ message: 'Помещение недоступно' });
    const start = new Date(startAt), end = new Date(endAt);
    if (start <= new Date() || !isValidCampusTime(start, end))
      return res.status(400).json({ message: 'Некорректные дата и время' });
    const n = Number(capacity);
    if (!Number.isInteger(n) || n < Math.max(1, event.registeredCount || 0) || n > place.capacity)
      return res.status(400).json({ message: 'Вместимость меньше числа участников или превышает лимит помещения' });
    const conflict = await Event.exists({ _id: { $ne: event._id }, status: { $ne: 'cancelled' },
      venue: place._id, startAt: { $lt: end }, endAt: { $gt: start } });
    if (conflict) return res.status(409).json({ message: 'Помещение занято в это время' });
    const images = [];
    for (const file of req.files || []) {
      const result = await uploadToCloudinary(file);
      images.push(result.secure_url);
      uploadedPublicIds.push(result.public_id);
    }
    const application = await Application.create({
      requestType: 'update', targetEvent: event._id,
      title: title.trim(), category: category.trim(), description: description.trim(),
      venue: place._id, startAt: start, endAt: end, capacity: n,
      phone: phone.trim(), comment: typeof comment === 'string' ? comment.trim() : '',
      images: images.length ? images : original.images,
      createdBy: req.user._id, status: 'pending'
    });
    saved = true;
    return res.status(201).json({ message: 'Запрос на обновление данных отправлен', application });
  } catch (error) {
    console.error('Ошибка запроса обновления:', error);
    return res.status(500).json({ message: 'Не удалось отправить изменения' });
  } finally {
    if (!saved && uploadedPublicIds.length) await deleteCloudinaryImages(uploadedPublicIds);
  }
});

// ========================================
// GET /api/applications/my
// МОИ ЗАЯВКИ
// ========================================


router.get('/my', requireAuth, async (req, res) => {
  try {
    const applications = await Application.find({
      createdBy: req.user._id,
    })
      .populate('venue', 'name building')
      .sort({ createdAt: -1 })
      .lean();

    // Исходные заявки связаны с мероприятиями через Event.application.
    const originalIds = applications
      .filter((application) => application.requestType !== 'update')
      .map((application) => application._id);

    // Заявки на изменение связаны через targetEvent.
    const targetIds = applications
      .filter(
        (application) =>
          application.requestType === 'update' &&
          application.targetEvent
      )
      .map((application) => application.targetEvent);

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

    // Определяем, было ли мероприятие отменено.
    const visibleApplications = applications
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
      // Убираем отменённые мероприятия из профиля.
      .filter(
        (application) =>
          application.eventStatus !== 'cancelled'
      );

    return res.json(visibleApplications);
  } catch (error) {
    console.error('Ошибка загрузки заявок:', error);

    return res.status(500).json({
      message: 'Не удалось загрузить заявки',
    });
  }
});


// ========================================
// GET /api/applications
// ЗАЯВКИ ДЛЯ АДМИНИСТРАТОРА
// ========================================

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
            message: 'Некорректный статус заявки',
          });
        }

        filter.status = req.query.status;
      }

      const applications = await Application.find(filter)
        .populate(
          'venue',
          'name building capacity'
        )
        .populate(
          'createdBy',
          'full_name email role'
        )
        .sort({ createdAt: -1 });

      return res.json(applications);
    } catch (error) {
      console.error(
        'Ошибка загрузки заявок администратора:',
        error
      );

      return res.status(500).json({
        message: 'Не удалось загрузить заявки',
      });
    }
  }
);

// ========================================
// PATCH /api/applications/:id/status
// ОДОБРЕНИЕ ИЛИ ОТКЛОНЕНИЕ ЗАЯВКИ
// ========================================

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
          message:
            'Допустимые решения: approved или rejected',
        });
      }

      const application =
        await Application.findById(id);

      if (!application) {
        return res.status(404).json({
          message: 'Заявка не найдена',
        });
      }

      if (application.status !== 'pending') {
        return res.status(409).json({
          message:
            'По этой заявке уже принято решение',
        });
      }

      // ========================================
      // ОТКЛОНЕНИЕ ЗАЯВКИ
      // ========================================

      if (status === 'rejected') {
        if (
          typeof rejectionReason !== 'string' ||
          !rejectionReason.trim()
        ) {
          return res.status(400).json({
            message: 'Укажи причину отклонения',
          });
        }

        const updated =
          await Application.findOneAndUpdate(
            {
              _id: id,
              status: 'pending',
            },
            {
              $set: {
                status: 'rejected',
                rejectionReason:
                  rejectionReason.trim(),
              },
            },
            { new: true }
          );

        if (!updated) {
          return res.status(409).json({
            message: 'Заявка уже обработана',
          });
        }

        return res.json({
          message: 'Заявка отклонена',
          application: updated,
        });
      }

      // Обновление существующего мероприятия вместо Event.create.
      if (application.requestType === 'update') {
        const venue = await Venue.findOne({ _id: application.venue, isActive: true });
        if (!venue || application.startAt <= new Date() ||
            !isValidCampusTime(application.startAt, application.endAt) ||
            application.capacity > venue.capacity) {
          return res.status(400).json({ message: 'Некорректное время, место или вместимость' });
        }
        const event = await Event.findOne({ _id: application.targetEvent, status: { $ne: 'cancelled' } });
        if (!event || event.startAt <= new Date()) {
          return res.status(409).json({ message: 'Мероприятие уже отменено или началось' });
        }
        if (application.capacity < (event.registeredCount || 0)) {
          return res.status(409).json({ message: 'Мест меньше числа зарегистрированных участников' });
        }
        const conflict = await Event.exists({ _id: { $ne: event._id }, status: { $ne: 'cancelled' },
          venue: application.venue, startAt: { $lt: application.endAt }, endAt: { $gt: application.startAt } });
        if (conflict) return res.status(409).json({ message: 'Помещение занято' });
        const session = await mongoose.startSession();
        try {
          await session.withTransaction(async () => {
            const changed = await Application.findOneAndUpdate(
              { _id: id, status: 'pending' },
              { $set: { status: 'approved', rejectionReason: '' } }, { new: true, session }
            );
            if (!changed) { const e = new Error('Заявка уже обработана'); e.status = 409; throw e; }
            const result = await Event.updateOne(
              { _id: event._id, status: { $ne: 'cancelled' } },
              { $set: {
                title: application.title, category: application.category,
                description: application.description, venue: application.venue,
                startAt: application.startAt, endAt: application.endAt,
                capacity: application.capacity, phone: application.phone,
                images: application.images
              } }, { session }
            );
            if (!result.matchedCount) { const e = new Error('Мероприятие недоступно'); e.status = 409; throw e; }
            // Исходная заявка должна отражать уже опубликованные данные для следующих правок.
            await Application.updateOne(
              { _id: event.application },
              { $set: { title: application.title, category: application.category,
                description: application.description, venue: application.venue,
                startAt: application.startAt, endAt: application.endAt,
                capacity: application.capacity, phone: application.phone,
                images: application.images, comment: application.comment } },
              { session }
            );
          });
        } finally { await session.endSession(); }
        return res.json({ message: 'Данные мероприятия обновлены', applicationId: id, eventId: event._id });
      }

      // ========================================
      // ОДОБРЕНИЕ ЗАЯВКИ
      // ========================================

      const venue = await Venue.findOne({
        _id: application.venue,
        isActive: true,
      });

      if (!venue) {
        return res.status(400).json({
          message: 'Помещение больше недоступно',
        });
      }

      if (application.startAt <= new Date()) {
        return res.status(400).json({
          message:
            'Нельзя одобрить мероприятие с прошедшим временем начала',
        });
      }

      if (
        application.endAt <= application.startAt ||
        application.capacity > venue.capacity
      ) {
        return res.status(400).json({
          message:
            'Некорректное время или вместимость мероприятия',
        });
      }

      // Повторно проверяем время
      // Нельзя одобрить старые заявки на 00:00
      if (
        !isValidCampusTime(
          application.startAt,
          application.endAt
        )
      ) {
        return res.status(400).json({
          message:
            'Нельзя одобрить заявку: мероприятие должно ' +
            'начинаться с 07:00 до 19:00 ' +
            'и заканчиваться не позднее 21:00.',
        });
      }

      // Проверяем занятость помещения
      const conflict = await Event.findOne({
        status: { $ne: 'cancelled' },
        venue: application.venue,
        startAt: {
          $lt: application.endAt,
        },
        endAt: {
          $gt: application.startAt,
        },
      });

      if (conflict) {
        return res.status(409).json({
          message:
            'Нельзя одобрить заявку: помещение занято в это время',
        });
      }

      // Атомарно меняем статус заявки
      const updated =
        await Application.findOneAndUpdate(
          {
            _id: id,
            status: 'pending',
          },
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

      try {
        // ========================================
        // ПУБЛИКУЕМ МЕРОПРИЯТИЕ
        // ========================================

        const event = await Event.create({
          title: updated.title,
          category: updated.category,
          description: updated.description,
          venue: updated.venue,
          startAt: updated.startAt,
          endAt: updated.endAt,
          capacity: updated.capacity,
          registeredCount: 0,
          phone: updated.phone,

          // Фотографии из заявки
          images: updated.images || [],

          organizer: updated.createdBy,
          application: updated._id,
        });

        return res.json({
          message:
            'Заявка одобрена, мероприятие опубликовано',
          application: updated,
          event,
        });
      } catch (error) {
        // Если создание мероприятия не удалось,
        // возвращаем заявку на рассмотрение
        await Application.updateOne(
          {
            _id: id,
            status: 'approved',
          },
          {
            $set: {
              status: 'pending',
            },
          }
        );

        throw error;
      }
    } catch (error) {
      console.error(
        'Ошибка обработки заявки:',
        error
      );

      return res.status(error.status || 500).json({
        message: error.status ? error.message : 'Не удалось обработать заявку',
      });
    }
  }
);

export default router;
