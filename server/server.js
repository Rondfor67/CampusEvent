
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";

// Подключаем маршруты
import authRouter from "./routes/auth.js";
import eventsRouter from "./routes/events.js";
import registrationsRouter from "./routes/registrations.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Настройки сервера
app.use(cors());
app.use(express.json());

// Проверка работы API и MongoDB
app.get("/", (req, res) => {
  res.json({
    message: "CampusEvents API успешно работает!",
    database: "MongoDB Atlas",
    status: "connected",
  });
});

// Маршруты API
app.use("/api/auth", authRouter);
app.use("/api/events", eventsRouter);
app.use("/api/registrations", registrationsRouter);

// Обработка неизвестных адресов
app.use((req, res) => {
  res.status(404).json({
    message: "Маршрут не найден",
  });
});

// Запуск сервера после подключения MongoDB
async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Сервер запущен: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Ошибка запуска сервера:", error.message);
    process.exit(1);
  }
}

startServer();
