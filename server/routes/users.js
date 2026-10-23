
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Проверка администратора
async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || '';

    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Необходимо войти в аккаунт',
      });
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.id);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        message: 'Доступ разрешён только администратору',
      });
    }

    next();
  } catch {
    return res.status(401).json({
      message: 'Недействительная авторизация',
    });
  }
}

// GET /api/users
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('full_name email role createdAt')
      .sort({ createdAt: -1 });

    res.json(users.map((user) => ({
      id: user._id.toString(),
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })));
  } catch (error) {
    console.error('Ошибка загрузки пользователей:', error);

    res.status(500).json({
      message: 'Не удалось загрузить пользователей',
    });
  }
});

export default router;
