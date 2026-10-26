
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import contactsRouter from './routes/contacts.js';

//Существующие маршруты
import authRouter from "./routes/auth.js";
import eventsRouter from "./routes/events.js";
import registrationsRouter from "./routes/registrations.js";
import usersRouter from './routes/users.js'; 

//Новые маршруты
import venuesRouter from "./routes/venues.js";
import applicationsRouter from "./routes/applications.js";
import notificationsRouter from "./routes/notifications.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

//Настройки сервера
app.use(cors());
app.use(express.json());

//Проверка работы API
app.get("/", (req, res) => {
  res.json({
    message: "CampusEvents API успешно работает!",
    database: "MongoDB Atlas",
    status: "connected",
  });
});

//Существующие API
app.use("/api/auth", authRouter);
app.use("/api/events", eventsRouter);
app.use("/api/registrations", registrationsRouter);
app.use('/api/users', usersRouter);
app.use('/api/contacts', contactsRouter);

//Новые API
app.use("/api/venues", venuesRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/notifications", notificationsRouter);

//Неизвестные маршруты
app.use((req, res) => {
  res.status(404).json({
    message: "Маршрут не найден",
  });
});

//Запуск сервера
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
