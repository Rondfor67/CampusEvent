import { connectDB } from '../config/database.js';
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

async function createAdmin() {
  try {
    await connectDB();

    console.log('Подключение к MongoDB успешно');

    const email = 'dina@gmail.com';

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log('Пользователь с таким email уже существует');
      return;
    }

    const password = process.env.ADMIN_PASSWORD;

    if (!password) {
      throw new Error(
        'Добавь ADMIN_PASSWORD в server/.env'
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await User.create({
      full_name: 'Дина Копбаева',
      email,
      password_hash: passwordHash,
      role: 'admin',
    });

    console.log('Администратор успешно создан!');
    console.log('ФИО: Дина Копбаева');
    console.log('Email: dina@gmail.com');
    console.log('Роль: admin');
  } catch (error) {
    console.error('Ошибка:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
