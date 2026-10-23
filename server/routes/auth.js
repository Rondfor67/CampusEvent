
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import AllowedStudent from '../models/AllowedStudent.js';
import AllowedTeacher from '../models/AllowedTeacher.js';

const router = express.Router();

function isValidIin(iin) {
  if (!/^\d{12}$/.test(iin)) {
    return false;
  }

  const year = Number(iin.slice(0, 2));
  const month = Number(iin.slice(2, 4));
  const day = Number(iin.slice(4, 6));
  const centuryCode = Number(iin[6]);

  if (![1, 2, 3, 4, 5, 6].includes(centuryCode)) {
    return false;
  }

  const century =
    centuryCode <= 2 ? 1800 :
    centuryCode <= 4 ? 1900 : 2000;

  const fullYear = century + year;
  const date = new Date(Date.UTC(fullYear, month - 1, day));

  return (
    date.getUTCFullYear() === fullYear &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isAllowedStudentIin(iin) {
  if (!isValidIin(iin)) {
    return false;
  }

  const year = Number(iin.slice(0, 2));
  const centuryCode = Number(iin[6]);

  return (
    [5, 6].includes(centuryCode) &&
    2000 + year >= 2008 &&
    2000 + year <= 2011
  );
}

function normalizePhone(phone) {
  if (typeof phone !== 'string') return null;

  const cleaned = phone.replace(/[\s()-]/g, '');

  if (/^8\d{10}$/.test(cleaned)) {
    return '+7' + cleaned.slice(1);
  }

  if (/^7\d{10}$/.test(cleaned)) {
    return '+' + cleaned;
  }

  if (/^\+7\d{10}$/.test(cleaned)) {
    return cleaned;
  }

  return null;
}

function createToken(user) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET не настроен');
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    secret,
    { expiresIn: '24h' }
  );
}

// РЕГИСТРАЦИЯ
router.post('/register', async (req, res) => {
  try {
    const {
      iin,
      full_name,
      email,
      phone,
      password,
      role = 'user',
    } = req.body || {};

    if (
      typeof iin !== 'string' ||
      typeof full_name !== 'string' ||
      typeof email !== 'string' ||
      typeof phone !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        message: 'Заполните все поля, включая номер телефона',
      });
    }

    // Администратора через регистрацию создать нельзя
    if (!['user', 'teacher'].includes(role)) {
      return res.status(403).json({
        message: 'Недопустимая роль пользователя',
      });
    }

    const cleanIin = iin.trim();
    const cleanName = full_name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = normalizePhone(phone);

    const validRoleIin =
      role === 'teacher'
        ? isValidIin(cleanIin)
        : isAllowedStudentIin(cleanIin);

    if (
      !validRoleIin ||
      !cleanName ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
      !cleanPhone ||
      password.length < 8
    ) {
      return res.status(400).json({
        message:
          'Проверьте ИИН, ФИО, email, телефон и пароль (минимум 8 символов)',
      });
    }

    // Проверяем разрешённый список по роли
    const allowedPerson =
      role === 'teacher'
        ? await AllowedTeacher.findOne({ iin: cleanIin })
        : await AllowedStudent.findOne({ iin: cleanIin });

    if (!allowedPerson) {
      return res.status(403).json({
        message:
          role === 'teacher'
            ? 'Ваш ИИН отсутствует в списке преподавателей'
            : 'Ваш ИИН отсутствует в списке студентов',
      });
    }

    if (
      allowedPerson.full_name.trim().toLowerCase() !==
      cleanName.toLowerCase()
    ) {
      return res.status(400).json({
        message: 'ФИО не соответствует данным разрешённого списка',
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { iin: cleanIin },
        { email: cleanEmail },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        message:
          'Пользователь с таким ИИН или email уже зарегистрирован',
      });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const user = await User.create({
      iin: cleanIin,
      full_name: allowedPerson.full_name,
      email: cleanEmail,
      phone: cleanPhone,
      password_hash,
      role,
    });

    return res.status(201).json({
      message: 'Регистрация успешна',
      token: createToken(user),
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Пользователь уже зарегистрирован',
      });
    }

    console.error('Ошибка регистрации:', error.message);

    return res.status(500).json({
      message: 'Ошибка сервера',
    });
  }
});

// ВХОД
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        message: 'Введите email и пароль',
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select('+password_hash');

    if (!user) {
      return res.status(401).json({
        message: 'Неверный email или пароль',
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({
        message: 'Неверный email или пароль',
      });
    }

    return res.json({
      message: 'Вход выполнен',
      token: createToken(user),
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Ошибка входа:', error.message);

    return res.status(500).json({
      message: 'Ошибка сервера',
    });
  }
});

export default router;
