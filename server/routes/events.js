import express from "express";
import pool from "../db.js"; // Подключение к базе данных

const router = express.Router();

// 1. Получить все мероприятия
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM events ORDER BY event_date ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка сервера при получении мероприятий" });
  }
});

// 2. Получить одно мероприятие по ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM events WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Мероприятие не найдено" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// 3. Добавить мероприятие
router.post("/", async (req, res) => {
  try {
    const { title, description, event_date, organizer_id } = req.body;

    if (!title || !event_date) {
      return res.status(400).json({ message: "Укажите название и дату мероприятия" });
    }

    const newEvent = await pool.query(
      `INSERT INTO events (title, description, event_date, organizer_id) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, description || "", event_date, organizer_id || null]
    );

    res.status(201).json({
      message: "Мероприятие создано",
      event: newEvent.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка сервера при создании мероприятия", error: err.message });
  }
});

// 4. Удалить мероприятие
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await pool.query("DELETE FROM events WHERE id = $1 RETURNING *", [id]);

    if (deleted.rows.length === 0) {
      return res.status(404).json({ message: "Мероприятие не найдено" });
    }

    res.json({ message: "Мероприятие удалено" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка сервера при удалении" });
  }
});

export default router;