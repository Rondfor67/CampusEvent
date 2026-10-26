
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import Contact from '../models/Contact.js';
import User from '../models/User.js';

const router = express.Router();

//Проверка администратора
async function requireAdmin(req, res, next) {
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

    if (user.role !== 'admin') {
      return res.status(403).json({
        message: 'Доступ только для администратора',
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

// POST /api/contacts
// Отправка обращения студентом или гостем
router.post('/', async (req, res) => {
  try {
    const { full_name, email, subject, message } = req.body || {};

    // Проверяем типы данных
    if (
      typeof full_name !== 'string' ||
      typeof email !== 'string' ||
      typeof subject !== 'string' ||
      typeof message !== 'string'
    ) {
      return res.status(400).json({
        message: 'Заполни все поля формы',
      });
    }

    //Убираем лишние пробелы
    const name = full_name.trim();
    const emailValue = email.trim().toLowerCase();
    const subjectValue = subject.trim();
    const text = message.trim();

    //Проверяем обязательные поля
    if (!name || !emailValue || !subjectValue || !text) {
      return res.status(400).json({
        message: 'Заполни все поля формы',
      });
    }

    //Проверяем длину полей
    if (
      name.length > 100 ||
      emailValue.length > 254 ||
      subjectValue.length > 200 ||
      text.length > 5000
    ) {
      return res.status(400).json({
        message: 'Превышена допустимая длина текста',
      });
    }

    //Проверяем email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(emailValue)) {
      return res.status(400).json({
        message: 'Некорректный email',
      });
    }

    //Проверяем авторизацию, если передан токен
    const header = req.headers.authorization || '';
    let currentUser = null;

    if (header) {
      if (!header.startsWith('Bearer ')) {
        return res.status(401).json({
          message: 'Некорректная авторизация',
        });
      }

      try {
        const payload = jwt.verify(
          header.slice(7),
          process.env.JWT_SECRET
        );

        currentUser = await User.findById(payload.id);

        if (!currentUser) {
          return res.status(401).json({
            message: 'Пользователь не найден',
          });
        }

        //Администратор не может отправлять обращения
        if (currentUser.role === 'admin') {
          return res.status(403).json({
            message: 'Администратор не может отправлять обращения',
          });
        }
      } catch {
        return res.status(401).json({
          message: 'Недействительная авторизация',
        });
      }
    }

    //Сохраняем обращение в монго дб
    const contact = await Contact.create({
      full_name: name,
      email: emailValue,
      subject: subjectValue,
      message: text,
      user: currentUser?._id || null,
      status: 'new',
    });

    return res.status(201).json({
      message: 'Сообщение успешно отправлено',
      contactId: contact._id,
    });
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);

    return res.status(500).json({
      message: 'Не удалось отправить сообщение',
    });
  }
});

//GET /api/contacts
//Список всех обращений только админ
router.get('/', requireAdmin, async (req, res) => {
  try {
    const contacts = await Contact.find()
    .populate('user', 'full_name email phone')
    .sort({ createdAt: -1 });

    return res.json(contacts);
  } catch (error) {
    console.error('Ошибка загрузки сообщений:', error);

    return res.status(500).json({
      message: 'Не удалось загрузить сообщения',
    });
  }
});

//PATCH /api/contacts/:id/status
//Изменение статуса обращения только админ
router.patch(
  '/:id/status',
  requireAdmin,
  async (req, res) => {
    try {
      const { status } = req.body || {};

      if (!['new', 'read', 'resolved'].includes(status)) {
        return res.status(400).json({
          message: 'Некорректный статус',
        });
      }

      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          message: 'Некорректный ID сообщения',
        });
      }

      const contact = await Contact.findByIdAndUpdate(
        req.params.id,
        { status },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!contact) {
        return res.status(404).json({
          message: 'Сообщение не найдено',
        });
      }

      return res.json({
        message: 'Статус сообщения обновлён',
        contact,
      });
    } catch (error) {
      console.error('Ошибка обновления сообщения:', error);

      return res.status(500).json({
        message: 'Не удалось обновить сообщение',
      });
    }
  }
);

export default router;
