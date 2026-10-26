
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import User from '../models/User.js';

const groupStudents = [
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
  'Мейірхаг Гауһар',
  'Нурмухамбетова Ада',
  'Нұржанулы Санжар',
  'Полатбек Ақнур',
  'Сериков Шахан',
  'Төрехан Әбілмансұр',
  'Тримова Айша',
  'Тулешев Мирас',
  'Каратаева Злата',
];

const additionalStudents = [
  'Ахметов Арман',
  'Сулейменова Аружан',
  'Ермеков Данияр',
  'Омарова Мадина',
  'Жумабаев Алихан',
  'Ибраева Алина',
  'Касымов Нурасыл',
  'Тлеубергенова Айгерим',
  'Садыков Тимур',
  'Абдрахманова Диана',
  'Нургалиев Алан',
  'Кенжебаева Аружан',
  'Бекенов Руслан',
  'Исмаилова Сабина',
  'Калиев Алишер',
  'Мухамедова Камилла',
  'Токтаров Адилет',
  'Амангелдиева Назерке',
  'Жаксылыков Нурислам',
  'Есенова Томирис',
];

const teachers = [
  'Абдрахманова Гульмира',
  'Серикбаев Марат',
  'Омарова Айгуль',
  'Жумагалиев Ерлан',
  'Касымова Динара',
  'Ахметова Сауле',
  'Тулегенов Нурлан',
  'Смагулова Алия',
  'Ермекбаев Болат',
  'Ибраева Жанар',
  'Нургалиева Асель',
  'Бекенова Гульназ',
  'Сулейменов Арман',
  'Мухамеджанова Лаура',
  'Калиева Меруерт',
  'Токтарбаев Руслан',
  'Аманжолова Назгуль',
  'Исмаилов Канат',
  'Есенбаев Даурен',
  'Жаксылыкова Айман',
];

function makeDemoIin(index, role) {
  let year;
  let centuryCode;

  if (role === 'teacher') {
    year = 75 + (index % 20);
    centuryCode = index % 2 === 0 ? 3 : 4;
  } else {
    year = 8 + (index % 4);
    centuryCode = index % 2 === 0 ? 5 : 6;
  }

  const yy = String(year).padStart(2, '0');
  const month = String((index % 12) + 1).padStart(2, '0');
  const day = String((index % 28) + 1).padStart(2, '0');

  const serial = String(
    role === 'teacher' ? 50000 + index : 10000 + index
  ).padStart(5, '0');

  return `${yy}${month}${day}${centuryCode}${serial}`;
}

function makeDemoPhone(index) {
  return `+7000000${String(index).padStart(4, '0')}`;
}

async function main() {
  const rl = readline.createInterface({ input, output });

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI не указан в .env');
    }

    const password = await rl.question(
      'Общий тестовый пароль для 59 аккаунтов (минимум 8 символов): '
    );

    if (password.length < 8) {
      throw new Error('Пароль должен содержать минимум 8 символов');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const db = mongoose.connection.db;

    if (db.databaseName !== 'campusevents') {
      throw new Error(
        `Неверная база: ${db.databaseName}. Ожидалась campusevents`
      );
    }

    const password_hash = await bcrypt.hash(password, 12);

    const students = [
      ...groupStudents,
      ...additionalStudents,
    ];

    let createdStudents = 0;
    let createdTeachers = 0;

    async function addPerson(fullName, role, index) {
      const iin = makeDemoIin(index, role);
      const email =
        role === 'teacher'
          ? `teacher${index + 1}@example.com`
          : `student${index + 1}@example.com`;

      const phone = makeDemoPhone(
        role === 'teacher' ? index + 100 : index + 1
      );

      const allowedCollection =
        role === 'teacher'
          ? 'allowed_teachers'
          : 'allowed_students';

      await db.collection(allowedCollection).updateOne(
        { iin },
        {
          $setOnInsert: {
            iin,
            full_name: fullName,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      const existing = await User.findOne({ email });

      if (existing) {
        console.log(`Пропущен: ${email} (уже существует)`);
        return false;
      }

      await User.create({
        iin,
        full_name: fullName,
        email,
        phone,
        password_hash,
        role,
      });

      console.log(
        `Создан: ${fullName} | ${role} | ${email}`
      );

      return true;
    }

    console.log('\nДобавляем студентов...\n');

    for (let i = 0; i < students.length; i++) {
      const created = await addPerson(
        students[i],
        'user',
        i
      );

      if (created) createdStudents++;
    }

    console.log('\nДобавляем преподавателей...\n');

    for (let i = 0; i < teachers.length; i++) {
      const created = await addPerson(
        teachers[i],
        'teacher',
        i
      );

      if (created) createdTeachers++;
    }

    console.log('\nГотово!');
    console.log('Создано студентов:', createdStudents);
    console.log('Создано преподавателей:', createdTeachers);
    console.log(
      'Всего новых аккаунтов:',
      createdStudents + createdTeachers
    );

    console.log('\nТестовые email:');
    console.log('student1@example.com ... student39@example.com');
    console.log('teacher1@example.com ... teacher20@example.com');

    console.log(
      'Пароль для этих аккаунтов — тот, который ты ввела.'
    );
  } catch (error) {
    console.error('Ошибка:', error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

main();
