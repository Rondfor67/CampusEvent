
import express from "express";
import mongoose from "mongoose";

import Venue from "../models/Venue.js";
import Application from "../models/Application.js";

const router = express.Router();

// GET /api/venues
// Получить список доступных помещений
router.get("/", async (req, res) => {
  try {
    const venues = await Venue.find({
      isActive: true,
    }).sort({ building: 1, name: 1 });

    res.json(venues);
  } catch (error) {
    console.error("Ошибка получения помещений:", error);

    res.status(500).json({
      message: "Не удалось загрузить помещения",
    });
  }
});

// GET /api/venues/:id/availability?date=2026-11-15
// Получить занятые интервалы помещения на выбранную дату
router.get("/:id/availability", async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    // Проверяем ID помещения
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Некорректный ID помещения",
      });
    }

    // Проверяем формат даты
    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return res.status(400).json({
        message: "Дата должна быть в формате YYYY-MM-DD",
      });
    }

    // Проверяем, существует ли такая дата
    const startOfDay = new Date(`${date}T00:00:00+05:00`);

    if (
      Number.isNaN(startOfDay.getTime()) ||
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Almaty",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(startOfDay) !== date
    ) {
      return res.status(400).json({
        message: "Некорректная дата",
      });
    }

    const endOfDay = new Date(
      startOfDay.getTime() + 24 * 60 * 60 * 1000
    );

    // Ищем помещение
    const venue = await Venue.findOne({
      _id: id,
      isActive: true,
    });

    if (!venue) {
      return res.status(404).json({
        message: "Помещение не найдено",
      });
    }

    // Получаем одобренные заявки,
    // время которых пересекается с выбранной датой
    const applications = await Application.find({
      venue: venue._id,
      status: "approved",
      startAt: { $lt: endOfDay },
      endAt: { $gt: startOfDay },
    })
      .select("title startAt endAt")
      .sort({ startAt: 1 });

    const occupied = applications.map((item) => ({
      title: item.title,
      startAt: item.startAt,
      endAt: item.endAt,
    }));

    res.json({
      venue: {
        _id: venue._id,
        name: venue.name,
        building: venue.building,
        capacity: venue.capacity,
      },
      date,
      occupied,
    });
  } catch (error) {
    console.error("Ошибка проверки занятости:", error);

    res.status(500).json({
      message: "Не удалось проверить занятость помещения",
    });
  }
});

export default router;
