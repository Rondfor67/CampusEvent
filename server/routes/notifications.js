import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const router = express.Router();
router.use(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ message: 'Войдите в аккаунт' });
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    req.user = await User.findById(payload.id);
    if (!req.user) return res.status(401).json({ message: 'Пользователь не найден' });
    next();
  } catch {
    return res.status(401).json({ message: 'Недействительный токен' });
  }
});

router.get('/', async (req, res) => {
  try {
    const items = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 }).limit(100).lean();
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Не удалось загрузить уведомления' });
  }
});

router.post('/claim-popup', async (req, res) => {
  try {
    const item = await Notification.findOneAndUpdate(
      { recipient: req.user._id, shownAt: null },
      { $set: { shownAt: new Date() } },
      { new: true, sort: { createdAt: 1 } }
    );
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Не удалось получить уведомление' });
  }
});

router.patch('/:id/read', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Некорректный ID' });
  try {
    const item = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { $set: { readAt: new Date() } }, { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Уведомление не найдено' });
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Не удалось обновить уведомление' });
  }
});

export default router;
