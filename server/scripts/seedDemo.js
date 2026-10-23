
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { connectDB } from '../config/database.js';
import AllowedStudent from '../models/AllowedStudent.js';
import User from '../models/User.js';
import Venue from '../models/Venue.js';
import Application from '../models/Application.js';
import Event from '../models/Event.js';

// Пароль только для демонстрационных аккаунтов
const DEMO_PASSWORD = 'CampusDemo2026!';

// 30 вымышленных студентов
const names = [
  ['Алина', 'Соколова'],
  ['Арман', 'Нурланов'],
  ['Диана', 'Ахметова'],
  ['Тимур', 'Сериков'],
  ['Айша', 'Омарова'],
  ['Данияр', 'Беков'],
  ['Мадина', 'Ержанова'],
  ['Руслан', 'Ким'],
  ['София', 'Миронова'],
  ['Алихан', 'Толеубаев'],
  ['Камилла', 'Абдуллина'],
  ['Никита', 'Орлов'],
  ['Аружан', 'Есенова'],
  ['Ерасыл', 'Муратов'],
  ['Виктория', 'Петрова'],
  ['Нурали', 'Аскаров'],
  ['Амина', 'Садыкова'],
  ['Максим', 'Волков'],
  ['Дана', 'Ибраева'],
  ['Ильяс', 'Жумабаев'],
  ['Аделя', 'Каримова'],
  ['Артём', 'Фролов'],
  ['Жанель', 'Касымова'],
  ['Санжар', 'Ермеков'],
  ['Милана', 'Борисова'],
  ['Ислам', 'Турсынов'],
  ['Аяулым', 'Нурбекова'],
  ['Дамир', 'Алиев'],
  ['Элина', 'Романова'],
  ['Бекзат', 'Султанов'],
];

// Это учебные идентификаторы, а не реальные ИИН.
// Формат подходит под текущую проверку даты рождения
// в CampusEvents. Для реальной идентификации не применять.
function makeDemoIin(index) {
  const years = ['08', '09', '10', '11'];
  const year = years[index % years.length];
  const month = String((index % 12) + 1).padStart(2, '0');
  const day = String((index % 25) + 1).padStart(2, '0');
  const genderCode = index % 2 === 0 ? '6' : '5';
  const suffix = String(80000 + index).padStart(5, '0');

  return `${year}${month}${day}${genderCode}${suffix}`;
}

const eventPlans = [
  {
    title: 'День Республики Казахстан',
    category: 'Культура',
    description:
      'Студенческое празднование Дня Республики: музыкальные выступления, национальные танцы, викторины и праздничная программа.',
    venue: 'Атриум',
    start: '2026-10-25T14:00:00+05:00',
    end: '2026-10-25T16:00:00+05:00',
    capacity: 80,
    author: 0,
    approved: true,
  },
  {
    title: 'Посвящение в студенты',
    category: 'Праздник',
    description:
      'Торжественное посвящение первокурсников: конкурсы, выступления студенческих групп, знакомство с традициями колледжа.',
    venue: 'Актовый зал',
    start: '2026-11-06T15:00:00+05:00',
    end: '2026-11-06T17:00:00+05:00',
    capacity: 80,
    author: 1,
    approved: true,
  },
  {
    title: 'Турнир по волейболу',
    category: 'Спорт',
    description:
      'Дружеские соревнования между студенческими командами. Болельщики приветствуются!',
    venue: 'Спортивный зал',
    start: '2026-11-10T16:00:00+05:00',
    end: '2026-11-10T18:00:00+05:00',
    capacity: 30,
    author: 3,
    approved: true,
  },
  {
    title: 'Вечер настольных игр',
    category: 'Развлечения',
    description:
      'UNO, мафия, Alias и другие игры. Приходи знакомиться с новыми людьми и весело провести время.',
    venue: 'Коворкинг',
    start: '2026-11-13T16:00:00+05:00',
    end: '2026-11-13T18:00:00+05:00',
    capacity: 20,
    author: 4,
    approved: true,
  },
  {
    title: 'Тимбилдинг первокурсников',
    category: 'Спорт',
    description:
      'Командные эстафеты, игры на взаимодействие и весёлые задания для укрепления дружбы между группами.',
    venue: 'Спортивный зал',
    start: '2026-11-18T15:00:00+05:00',
    end: '2026-11-18T17:00:00+05:00',
    capacity: 35,
    author: 5,
    approved: true,
  },
  {
    title: 'Студенческий караоке-вечер',
    category: 'Развлечения',
    description:
      'Вечер любимых песен, музыкальных конкурсов и выступлений студентов.',
    venue: 'Актовый зал',
    start: '2026-11-21T17:00:00+05:00',
    end: '2026-11-21T19:00:00+05:00',
    capacity: 60,
    author: 6,
    approved: true,
  },
  {
    title: 'Турнир по настольному теннису',
    category: 'Спорт',
    description:
      'Любительский турнир среди студентов. Участники соревнуются в одиночных матчах.',
    venue: 'Спортивный зал',
    start: '2026-11-26T16:00:00+05:00',
    end: '2026-11-26T18:00:00+05:00',
    capacity: 24,
    author: 7,
    approved: true,
  },
  {
    title: 'Танцевальный баттл',
    category: 'Творчество',
    description:
      'Студенческие танцевальные команды покажут свои номера и поборются за звание лучших.',
    venue: 'Актовый зал',
    start: '2026-12-03T16:00:00+05:00',
    end: '2026-12-03T18:00:00+05:00',
    capacity: 70,
    author: 8,
    approved: true,
  },
  {
    title: 'День национальных традиций',
    category: 'Культура',
    description:
      'Знакомство с традициями Казахстана, национальные игры, творческие выступления и тематические площадки.',
    venue: 'Атриум',
    start: '2026-12-08T14:00:00+05:00',
    end: '2026-12-08T16:00:00+05:00',
    capacity: 70,
    author: 9,
    approved: false,
  },
  {
    title: 'Студенческий киновечер',
    category: 'Развлечения',
    description:
      'Совместный просмотр фильма, обсуждение и уютная атмосфера в компании одногруппников.',
    venue: 'Коворкинг',
    start: '2026-12-12T17:00:00+05:00',
    end: '2026-12-12T19:00:00+05:00',
    capacity: 20,
    author: 10,
    approved: false,
  },
  {
    title: 'Тайный Санта',
    category: 'Праздник',
    description:
      'Предновогодний обмен небольшими подарками между студентами и праздничные игры.',
    venue: 'Коворкинг',
    start: '2026-12-18T16:00:00+05:00',
    end: '2026-12-18T18:00:00+05:00',
    capacity: 20,
    author: 11,
    approved: false,
  },
  {
    title: 'Новогодняя дискотека',
    category: 'Праздник',
    description:
      'Новогодняя студенческая дискотека с музыкой, танцами, конкурсами и праздничной атмосферой.',
    venue: 'Актовый зал',
    start: '2026-12-31T17:00:00+05:00',
    end: '2026-12-31T20:00:00+05:00',
    capacity: 80,
    author: 12,
    approved: false,
  },
];

async function seedStudents() {
  const password_hash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const students = [];

  for (let i = 0; i < names.length; i++) {
    const [firstName, lastName] = names[i];

    const full_name = `${firstName} ${lastName}`;
    const iin = makeDemoIin(i);
    const email = `demo.student${String(i + 1).padStart(2, '0')}@example.com`;

    // Учебный номер-заглушка, не для звонков
    const phone = `DEMO-${String(i + 1).padStart(3, '0')}`;

    const allowed = await AllowedStudent.findOne({ iin });

    if (!allowed) {
      await AllowedStudent.create({
        iin,
        full_name,
      });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        iin,
        full_name,
        email,
        phone,
        password_hash,
        role: 'user',
      });

      console.log(`Создан студент: ${full_name}`);
    } else {
      console.log(`Уже существует: ${full_name}`);
    }

    students.push(user);
  }

  return students;
}

async function findVenue(name) {
  const venues = await Venue.find();

  const venue = venues.find((item) =>
    item.name.toLowerCase().includes(name.toLowerCase())
  );

  if (!venue) {
    throw new Error(
      `Не найдено помещение "${name}". Добавь его в коллекцию venues.`
    );
  }

  if (!venue.isActive) {
    throw new Error(`Помещение "${name}" неактивно.`);
  }

  return venue;
}

async function seedEvents(students) {
  for (const plan of eventPlans) {
    const venue = await findVenue(plan.venue);
    const author = students[plan.author];

    const capacity = Math.min(plan.capacity, venue.capacity);

    const startAt = new Date(plan.start);
    const endAt = new Date(plan.end);

    // Не создаём повторно одно и то же демо-мероприятие
    let application = await Application.findOne({
      title: plan.title,
      createdBy: author._id,
      startAt,
    });

    if (!application) {
      application = await Application.create({
        title: plan.title,
        category: plan.category,
        description: plan.description,
        venue: venue._id,
        startAt,
        endAt,
        capacity,
        phone: author.phone,
        comment: 'Демонстрационная студенческая заявка',
        createdBy: author._id,
        status: plan.approved ? 'approved' : 'pending',
      });
    }

    if (!plan.approved) {
      console.log(`Заявка на проверке: ${plan.title}`);
      continue;
    }

    const existingEvent = await Event.findOne({
      application: application._id,
    });

    if (existingEvent) {
      console.log(`Уже опубликовано: ${plan.title}`);
      continue;
    }

    // Защита от пересечения с опубликованными событиями
    const conflict = await Event.findOne({
      venue: venue._id,
      startAt: { $lt: endAt },
      endAt: { $gt: startAt },
    });

    if (conflict) {
      console.log(
        `Пропущено из-за конфликта времени: ${plan.title}`
      );
      continue;
    }

    await Event.create({
      title: plan.title,
      category: plan.category,
      description: plan.description,
      venue: venue._id,
      startAt,
      endAt,
      capacity,
      registeredCount: 0,
      phone: author.phone,
      organizer: author._id,
      application: application._id,
    });

    console.log(`Опубликовано: ${plan.title}`);
  }
}

async function main() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI отсутствует в .env');
    }

    await connectDB();

    console.log('\nСоздание демонстрационных студентов...');
    const students = await seedStudents();

    console.log('\nСоздание мероприятий...');
    await seedEvents(students);

    console.log('\nЗаполнение базы завершено!');
    console.log(`Демонстрационных аккаунтов: ${students.length}`);
    console.log(`Пароль для входа: ${DEMO_PASSWORD}`);
  } catch (error) {
    console.error('\nОшибка заполнения базы:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

await main();
