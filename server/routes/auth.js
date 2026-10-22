import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = express.Router();
const JWT_SECRET = "super_secret_campus_key";

// 1. РЕГИСТРАЦИЯ
router.post("/register", async (req, res) => {
  try {
    const { iin, full_name, email, password, role } = req.body;

    if (!iin || !full_name || !email || !password) {
      return res.status(400).json({ message: "Заполните все обязательные поля" });
    }

    // Проверяем, есть ли уже пользователь с таким email или iin
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR iin = $2",
      [email, iin]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "Пользователь с таким email или ИИН уже существует" });
    }

    // Хэшируем пароль
    const passwordHash = await bcrypt.hash(password, 10);

    // ВАЖНО: Если в таблице users из init.sql нет колонки password_hash, 
    // её нужно добавить один раз через SQL: ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
    const newUser = await pool.query(
      `INSERT INTO users (iin, full_name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, iin, full_name, email, role`,
      [iin, full_name, email, passwordHash, role || "student"]
    );

    res.status(201).json({
      message: "Регистрация прошла успешно",
      user: newUser.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка сервера при регистрации", error: err.message });
  }
});

// 2. АВТОРИЗАЦИЯ (ВХОД)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Введите email и пароль" });
    }

    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Неверный email или пароль" });
    }

    const user = userResult.rows[0];

    // Проверяем, задан ли пароль у пользователя в базе (так как в init.sql тестовые юзеры без паролей)
    if (!user.password_hash) {
      return res.status(401).json({ message: "Для этого аккаунта еще не задан пароль. Обратитесь к администратору." });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ message: "Неверный email или пароль" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Успешный вход",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка сервера при входе", error: err.message });
  }
});

export default router;