
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { connectDB } from '../config/database.js';
import AllowedStudent from '../models/AllowedStudent.js';
import User from '../models/User.js';

const PASSWORD = 'Campus2403Demo!';

const students = [
  'Алигожин Ерасыл',
  'Амантай Айзере',
  'Баймагулова Айым',
  'Бактыбай Абдурахман',
  'Дамаев Тамерлан',
  'Досан Азамат',
  'Әлимгазин Әділ',
  'Жетписбаева Есмина',
  'Камилжанов Арибжан',
  'Мадиев Эмирхан',
  'Нурмухамбетова Ада',
  'Нұржанулы Санжар',
  'Полатбек Ақнур',
  'Сериков Шахан',
  'Төрехан Әбілмансұр',
  'Тримова Айша',
  'Тулешев Мирас',
];

async function main() {
  try {
    await connectDB();

    const password_hash = await bcrypt.hash(PASSWORD, 12);

    let created = 0;
    let skipped = 0;

    for (let i = 0; i < students.length; i++) {
      const full_name = students[i];
      const email =
        `group2403.student${String(i + 1).padStart(2, '0')}@example.com`;

      const allowed = await AllowedStudent.findOne({ full_name });

      if (!allowed) {
        console.log(
          `Пропущен: ${full_name} — нет в allowed_students`
        );
        skipped++;
        continue;
      }

      const existing = await User.findOne({
        $or: [
          { iin: allowed.iin },
          { email },
        ],
      });

      if (existing) {
        console.log(`Уже зарегистрирован: ${full_name}`);
        skipped++;
        continue;
      }

      await User.create({
        iin: allowed.iin,
        full_name,
        email,
        phone: null,
        password_hash,
        role: 'user',
      });

      console.log(`Зарегистрирован: ${full_name} — ${email}`);
      created++;
    }

    console.log('\nГотово!');
    console.log(`Создано аккаунтов: ${created}`);
    console.log(`Пропущено: ${skipped}`);
    console.log(`Пароль: ${PASSWORD}`);
  } catch (error) {
    console.error('Ошибка:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

await main();
