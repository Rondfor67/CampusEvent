
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import AllowedStudent from '../models/AllowedStudent.js';

const router = express.Router();

function isAllowedStudentIin(iin) {
  if (!/^\d{12}$/.test(iin)) {
    return false;
  }

  const year = Number(iin.slice(0, 2));
  const month = Number(iin.slice(2, 4));
  const day = Number(iin.slice(4, 6));
  const centuryCode = Number(iin[6]);

  // Для рождённых в 2000–2099 годах
  if (centuryCode !== 5 && centuryCode !== 6) {
    return false;
  }

  const fullYear = 2000 + year;

  if (fullYear < 2008 || fullYear > 2011) {
    return false;
  }

  const date = new Date(Date.UTC(fullYear, month - 1, day));

  return (
    date.getUTCFullYear() === fullYear &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}


const JWT_SECRET = process.env.JWT_SECRET;

function createToken(user) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET не настроен');
  }

  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// РЕГИСТРАЦИЯ
router.post('/register', async (req, res) => {
  try {
    const { iin, full_name, email, password } = req.body;

    if (
      typeof iin !== 'string' ||
      typeof full_name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        message: 'Заполните все поля',
      });
    }

    const cleanIin = iin.trim();
    const cleanName = full_name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      !isAllowedStudentIin(cleanIin) ||
      !cleanName ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
      password.length < 8
    ) {
      return res.status(400).json({
        message: 'Проверьте ИИН, ФИО, email и пароль (минимум 8 символов)',
      });
    }

    // Проверяем ИИН по разрешённому списку
    const student = await AllowedStudent.findOne({ iin: cleanIin });

    if (!student) {
      return res.status(403).json({
        message: 'Ваш ИИН отсутствует в списке студентов',
      });
    }

    // Проверяем совпадение ФИО
    if (
      student.full_name.trim().toLowerCase() !==
      cleanName.toLowerCase()
    ) {
      return res.status(400).json({
        message: 'ФИО не соответствует данным студента',
      });
    }

    const existingUser = await User.findOne({
      $or: [{ iin: cleanIin }, { email: cleanEmail }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'Пользователь с таким ИИН или email уже зарегистрирован',
      });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const user = await User.create({
      iin: cleanIin,
      full_name: student.full_name,
      email: cleanEmail,
      password_hash,
      role: 'user',
    });

    return res.status(201).json({
      message: 'Регистрация успешна',
      token: createToken(user),
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
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
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string') {
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
