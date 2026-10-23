
import express from 'express';
import mongoose from 'mongoose';

import Event from '../models/Event.js';

const router = express.Router();

// GET /api/events
// Получить все опубликованные мероприятия
router.get('/', async (req, res) => {
  try {
    const events = await Event.find()
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

      // Фотографии из Cloudinary
      images: Array.isArray(event.images)
        ? event.images
        : [],
    }));

    res.json(result);
  } catch (error) {
    console.error('Ошибка получения мероприятий:', error);

    res.status(500).json({
      message: 'Не удалось загрузить мероприятия',
    });
  }
});

// GET /api/events/:id
// Получить одно опубликованное мероприятие
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: 'Некорректный ID мероприятия',
      });
    }

    const event = await Event.findById(id)
      .populate('venue', 'name building capacity')
      .lean();

    if (!event) {
      return res.status(404).json({
        message: 'Мероприятие не найдено',
      });
    }

    res.json({
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

      // Фотографии для галереи
      images: Array.isArray(event.images)
        ? event.images
        : [],
    });
  } catch (error) {
    console.error('Ошибка получения мероприятия:', error);

    res.status(500).json({
      message: 'Не удалось загрузить мероприятие',
    });
  }
});

export default router;
