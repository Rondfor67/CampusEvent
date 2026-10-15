
import express from "express";

const router = express.Router();

export const events = [
  {
    id: 1,
    title: "Campus Hackathon",
    description: "Хакатон для студентов AITU",
    date: "2026-11-15",
    location: "AITU",
    category: "IT",
    availableSeats: 50
  },
  {
    id: 2,
    title: "Student Meetup",
    description: "Встреча студентов",
    date: "2026-11-20",
    location: "Astana",
    category: "Networking",
    availableSeats: 30
  }
];

// Получить все мероприятия
router.get("/", (req, res) => {
  res.json(events);
});

// Получить одно мероприятие
router.get("/:id", (req, res) => {
  const event = events.find(
    (item) => item.id === Number(req.params.id)
  );

  if (!event) {
    return res.status(404).json({
      message: "Мероприятие не найдено"
    });
  }

  res.json(event);
});

// Добавить мероприятие
router.post("/", (req, res) => {
  const {
    title,
    description,
    date,
    location,
    category,
    availableSeats
  } = req.body;

  if (!title || !date || !location) {
    return res.status(400).json({
      message: "Укажите название, дату и место"
    });
  }

  const newEvent = {
    id: events.length
      ? Math.max(...events.map((item) => item.id)) + 1
      : 1,
    title,
    description: description || "",
    date,
    location,
    category: category || "Other",
    availableSeats: Math.max(
      0,
      Number(availableSeats) || 0
    )
  };

  events.push(newEvent);

  res.status(201).json({
    message: "Мероприятие создано",
    event: newEvent
  });
});

// Удалить мероприятие
router.delete("/:id", (req, res) => {
  const index = events.findIndex(
    (item) => item.id === Number(req.params.id)
  );

  if (index === -1) {
    return res.status(404).json({
      message: "Мероприятие не найдено"
    });
  }

  events.splice(index, 1);

  res.json({
    message: "Мероприятие удалено"
  });
});

export default router;
