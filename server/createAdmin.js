
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import User from './models/User.js';

const rl = readline.createInterface({ input, output });

async function createAdmin() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI не указан в .env');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const email = 'dina@gmail.com';

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log('Пользователь с таким email уже существует.');
      return;
    }

    const password = await rl.question(
      'Придумай пароль администратора (минимум 8 символов): '
    );

    if (password.length < 8) {
      console.log('Пароль должен содержать минимум 8 символов.');
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);

    const admin = await User.create({
      full_name: 'Дина Копбаева',
      email,
      password_hash,
      role: 'admin',
    });

    console.log('Администратор успешно создан!');
    console.log('ФИО:', admin.full_name);
    console.log('Email:', admin.email);
    console.log('Роль:', admin.role);
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

createAdmin();
