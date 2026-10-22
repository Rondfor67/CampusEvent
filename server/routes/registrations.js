import express from "express";
import pool from "../db.js";

const router = express.Router();

// 1. Получить все регистрации
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.id, r.registered_at, 
             u.id AS user_id, u.full_name, u.email, 
             e.id AS event_id, e.title AS event_title 
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка сервера при получении регистраций" });
  }
});

// 2. Получить регистрации конкретного мероприятия
router.get("/event/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await pool.query(`
      SELECT r.id, r.registered_at, 
             u.id AS user_id, u.full_name, u.email 
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      WHERE r.event_id = $1
    `, [eventId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// 3. Зарегистрироваться на мероприятие
router.post("/", async (req, res) => {
  try {
    const { userId, eventId } = req.body;

    if (!userId || !eventId) {
      return res.status(400).json({ message: "Укажите ID пользователя и ID мероприятия" });
    }

    // Проверяем, существует ли мероприятие
    const eventCheck = await pool.query("SELECT * FROM events WHERE id = $1", [eventId]);
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ message: "Мероприятие не найдено" });
    }

    // Проверяем, не зарегистрирован ли уже пользователь
    const existingReg = await pool.query(
      "SELECT * FROM registrations WHERE user_id = $1 AND event_id = $2",
      [userId, eventId]
    );

    if (existingReg.rows.length > 0) {
      return res.status(409).json({ message: "Вы уже зарегистрированы на это мероприятие" });
    }

    // Создаем регистрацию в базе
    const newRegistration = await pool.query(
      `INSERT INTO registrations (user_id, event_id) 
       VALUES ($1, $2) RETURNING *`,
      [userId, eventId]
    );

    res.status(201).json({
      message: "Успешная регистрация на мероприятие",
      registration: newRegistration.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка сервера при регистрации", error: err.message });
  }
});

export default router;