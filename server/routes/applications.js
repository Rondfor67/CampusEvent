
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
      .sort({ createdAt: -1 });

    return res.json(applications);
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

      return res.status(500).json({
        message: 'Не удалось обработать заявку',
      });
    }
  }
);

export default router;
