
import express from "express";
import { events } from "./events.js";

const router = express.Router();

const registrations = [];
let nextId = 1;

// Получить все регистрации
router.get("/", (req, res) => {
  res.json(registrations);
});

// Получить регистрации конкретного мероприятия
router.get("/event/:eventId", (req, res) => {
  const eventId = Number(req.params.eventId);

  const eventRegistrations = registrations.filter(
    (item) => item.eventId === eventId
  );

  res.json(eventRegistrations);
});

// Зарегистрироваться на мероприятие
router.post("/", (req, res) => {
  const { eventId, studentName, email } = req.body;

  if (
    !eventId ||
    !studentName?.trim() ||
    !email?.trim()
  ) {
    return res.status(400).json({
      message: "Заполните все обязательные поля"
    });
  }

  const event = events.find(
    (item) => item.id === Number(eventId)
  );

  if (!event) {
    return res.status(404).json({
      message: "Мероприятие не найдено"
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const alreadyRegistered = registrations.some(
    (item) =>
      item.eventId === event.id &&
      item.email === normalizedEmail
  );

  if (alreadyRegistered) {
    return res.status(409).json({
      message: "Вы уже зарегистрированы"
    });
  }

  const registeredCount = registrations.filter(
    (item) => item.eventId === event.id
  ).length;

  if (registeredCount >= event.availableSeats) {
    return res.status(400).json({
      message: "Свободных мест нет"
    });
  }

  const registration = {
    id: nextId++,
    eventId: event.id,
    studentName: studentName.trim(),
    email: normalizedEmail,
    createdAt: new Date().toISOString()
  };

  registrations.push(registration);

  res.status(201).json({
    message: "Вы успешно зарегистрировались",
    registration
  });
});

export default router;
