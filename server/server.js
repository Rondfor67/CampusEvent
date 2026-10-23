
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import eventsRouter from "./routes/events.js";
import registrationsRouter from "./routes/registrations.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Настройки сервера
app.use(cors());
app.use(express.json());

// Проверка работы API
app.get("/", (req, res) => {
  res.json({
    message: "CampusEvents API работает!"
  });
});

// Подключение маршрутов
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
