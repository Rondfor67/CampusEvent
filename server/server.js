import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";

// Подключаем наши роуты
import authRouter from "./routes/auth.js";
import eventsRouter from "./routes/events.js";
import registrationsRouter from "./routes/registrations.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Настройки сервера
app.use(cors());
app.use(express.json());

// Проверка работы API и связи с базой данных
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "CampusEvents API успешно работает и подключен к БД!",
      dbTime: result.rows[0].now
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка подключения к базе данных" });
  }
});

// Подключаем маршруты API
app.use("/api/auth", authRouter);
app.use("/api/events", eventsRouter);
app.use("/api/registrations", registrationsRouter);

// Обработка неизвестных адресов
app.use((req, res) => {
  res.status(404).json({
    message: "Маршрут не найден"
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});