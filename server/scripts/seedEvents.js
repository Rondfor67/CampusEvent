
import 'dotenv/config';
import dns from 'node:dns';
import mongoose from 'mongoose';

import User from '../models/User.js';
import Venue from '../models/Venue.js';
import Event from '../models/Event.js';
import Application from '../models/Application.js';

dns.setServers(['8.8.8.8']);

function astanaDate(date, time) {
  return new Date(`${date}T${time}:00+05:00`);
}

const VENUES = {
  HALL: 'Актовый зал',
  SPORT: 'Спортивный зал',
  ATRIUM: 'Атриум',
  COWORKING: 'Коворкинг',
  OPEN_SPACE: 'Open Space',
  CANTEEN: 'Столовая',
};

const approvedEvents = [
  {
    title: 'День Республики Казахстан',
    category: 'Праздники',
    description:
      'Торжественный концерт ко Дню Республики Казахстан. Выступления студентов, национальные танцы, музыкальные номера, поздравления преподавателей и праздничная программа.',
    venueName: VENUES.HALL,
    date: '2026-10-25',
    start: '14:00',
    end: '16:00',
    capacity: 180,
    author: 'teacher1@example.com',
    comment: 'Праздничный концерт ко Дню Республики.',
  },
  {
    title: 'Campus Hackathon 2026',
    category: 'IT',
    description:
      'Командный хакатон для студентов колледжа. Участники разработают прототипы сайтов и приложений, представят свои идеи и получат обратную связь от преподавателей.',
    venueName: VENUES.OPEN_SPACE,
    date: '2026-11-07',
    start: '10:00',
    end: '18:00',
    capacity: 50,
    author: 'teacher2@example.com',
    comment: 'Нужны интернет, проектор и рабочие места.',
  },
  {
    title: 'Новогодняя дискотека',
    category: 'Праздники',
    description:
      'Новогодняя дискотека для студентов колледжа. Музыка, танцы, конкурсы, праздничная фотозона, подарки и встреча Нового года в компании друзей.',
    venueName: VENUES.CANTEEN,
    date: '2026-12-31',
    start: '17:00',
    end: '20:00',
    capacity: 100,
    author: 'teacher3@example.com',
    comment: 'Нужны музыкальное оборудование и украшения.',
  },
  {
    title: 'Аниме-клуб: вечер просмотра',
    category: 'Клубы',
    description:
      'Встреча любителей аниме. Совместный просмотр, обсуждение любимых персонажей, тематическая викторина и общение.',
    venueName: VENUES.OPEN_SPACE,
    date: '2026-10-29',
    start: '16:00',
    end: '18:00',
    capacity: 25,
    author: 'student1@example.com',
    comment: 'Нужны проектор и экран.',
  },
  {
    title: 'Проектная мастерская',
    category: 'Образование',
    description:
      'Совместная работа над учебными и личными IT-проектами. Обсуждение идей, распределение задач, помощь с программированием и подготовка презентаций.',
    venueName: VENUES.COWORKING,
    date: '2026-11-03',
    start: '15:00',
    end: '17:00',
    capacity: 20,
    author: 'student2@example.com',
    comment: 'Рабочие места для командных проектов.',
  },
  {
    title: 'Посвящение в студенты',
    category: 'Праздники',
    description:
      'Торжественное посвящение первокурсников в студенты колледжа. Выступления, конкурсы, знакомство с традициями колледжа и праздничная программа.',
    venueName: VENUES.HALL,
    date: '2026-10-30',
    start: '15:00',
    end: '17:00',
    capacity: 180,
    author: 'teacher4@example.com',
    comment: 'Праздничная программа для первокурсников.',
  },
  {
    title: 'Турнир по программированию',
    category: 'IT',
    description:
      'Соревнование по решению алгоритмических задач на JavaScript, Python и других языках. Участники смогут проверить свои навыки и побороться за призовые места.',
    venueName: VENUES.OPEN_SPACE,
    date: '2026-11-12',
    start: '14:00',
    end: '17:00',
    capacity: 25,
    author: 'teacher5@example.com',
    comment: 'Участники приходят со своими ноутбуками.',
  },
  {
    title: 'Клуб настольных игр',
    category: 'Клубы',
    description:
      'Встреча студентов для настольных игр, общения и командных соревнований. Можно прийти одному или с друзьями.',
    venueName: VENUES.COWORKING,
    date: '2026-11-05',
    start: '16:00',
    end: '18:00',
    capacity: 20,
    author: 'student3@example.com',
    comment: 'Настольные игры принесут организаторы.',
  },
];

// Заявки, которые администратор ещё не рассмотрел
const pendingApplications = [
  {
    title: 'Турнир по Valorant',
    category: 'Киберспорт',
    description:
      'Студенческий турнир по Valorant. Командные соревнования, турнирная таблица и награждение победителей.',
    venueName: VENUES.OPEN_SPACE,
    date: '2026-11-14',
    start: '14:00',
    end: '18:00',
    capacity: 30,
    author: 'student4@example.com',
    comment: 'Участники будут использовать собственные ноутбуки.',
  },
  {
    title: 'Клуб корейского языка',
    category: 'Клубы',
    description:
      'Разговорный клуб корейского языка. Изучение базовых выражений, знакомство с культурой Кореи и практика общения.',
    venueName: VENUES.COWORKING,
    date: '2026-11-17',
    start: '16:00',
    end: '18:00',
    capacity: 20,
    author: 'student5@example.com',
    comment: 'Хотим проводить такие встречи регулярно.',
  },
  {
    title: 'Мастер-класс по Figma',
    category: 'IT',
    description:
      'Практический мастер-класс по созданию интерфейсов в Figma. Компоненты, Auto Layout, прототипирование и основы UI/UX.',
    venueName: VENUES.OPEN_SPACE,
    date: '2026-11-20',
    start: '14:00',
    end: '17:00',
    capacity: 30,
    author: 'teacher6@example.com',
    comment: 'Участникам понадобятся ноутбуки.',
  },
  {
    title: 'Благотворительная ярмарка',
    category: 'Сообщество',
    description:
      'Благотворительная ярмарка с изделиями студентов, выпечкой и творческими работами. Собранные средства направим на согласованную благотворительную цель.',
    venueName: VENUES.ATRIUM,
    date: '2026-11-24',
    start: '15:00',
    end: '18:00',
    capacity: 80,
    author: 'student6@example.com',
    comment: 'Просим выделить место для торговых столов.',
  },
  {
    title: 'Олимпиада по информатике',
    category: 'Образование',
    description:
      'Колледжная олимпиада по информатике. Задания по алгоритмам, логике и программированию.',
    venueName: VENUES.OPEN_SPACE,
    date: '2026-11-27',
    start: '14:00',
    end: '17:00',
    capacity: 30,
    author: 'teacher7@example.com',
    comment: 'Участники приходят с ноутбуками.',
  },
  {
    title: 'Вечер кино',
    category: 'Развлечения',
    description:
      'Совместный просмотр фильма с последующим обсуждением сюжета и персонажей.',
    venueName: VENUES.OPEN_SPACE,
    date: '2026-12-04',
    start: '16:00',
    end: '18:00',
    capacity: 30,
    author: 'student7@example.com',
    comment: 'Нужны проектор, звук и разрешение на показ.',
  },
];

async function main() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI не указан в .env');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const dbName = mongoose.connection.db.databaseName;

    if (dbName !== 'campusevents') {
      throw new Error(`Неверная база данных: ${dbName}`);
    }

    console.log('Подключено к базе:', dbName);

    let venues = await Venue.find();

    let canteen = venues.find(
      (venue) => venue.name.trim().toLowerCase() === 'столовая'
    );

    if (!canteen) {
      canteen = await Venue.create({
        name: 'Столовая',
        building: 'Главный корпус',
        capacity: 120,
        isActive: true,
      });

      console.log('Добавлена столовая');
      venues.push(canteen);
    } else {
      console.log('Столовая уже существует');
    }

    const venueMap = new Map(
      venues.map((venue) => [venue.name.trim(), venue])
    );

    const allItems = [
      ...approvedEvents,
      ...pendingApplications,
    ];

    for (const item of allItems) {
      const venue = venueMap.get(item.venueName);

      if (!venue) {
        throw new Error(
          `Помещение "${item.venueName}" отсутствует в базе`
        );
      }

      if (!venue.isActive) {
        throw new Error(
          `Помещение "${item.venueName}" неактивно`
        );
      }

      if (item.capacity > venue.capacity) {
        throw new Error(
          `"${item.title}": ${item.capacity} мест, ` +
          `но в помещении "${venue.name}" только ${venue.capacity}`
        );
      }

      if (
        astanaDate(item.date, item.start) >=
        astanaDate(item.date, item.end)
      ) {
        throw new Error(
          `Неправильное время мероприятия: ${item.title}`
        );
      }
    }

    const authorEmails = [
      ...new Set(allItems.map((item) => item.author)),
    ];

    const users = await User.find({
      email: { $in: authorEmails },
    });

    const userMap = new Map(
      users.map((user) => [user.email, user])
    );

    for (const email of authorEmails) {
      if (!userMap.has(email)) {
        throw new Error(
          `Пользователь ${email} не найден. ` +
          'Сначала запусти seedUsers.js'
        );
      }
    }

    let eventsCreated = 0;
    let approvedCreated = 0;
    let pendingCreated = 0;

    async function createApplication(item, status) {
      const venue = venueMap.get(item.venueName);
      const author = userMap.get(item.author);

      const startAt = astanaDate(item.date, item.start);
      const endAt = astanaDate(item.date, item.end);

      const existing = await Application.findOne({
        title: item.title,
        startAt,
      });

      if (existing) {
        console.log(`Пропущено: ${item.title}`);
        return null;
      }

      const application = await Application.create({
        title: item.title,
        category: item.category,
        description: item.description,
        venue: venue._id,
        startAt,
        endAt,
        capacity: item.capacity,
        phone: author.phone || '+70000000000',
        comment: item.comment,
        createdBy: author._id,
        status,
        rejectionReason: '',
      });

      console.log(
        `Заявка ${status}: ${item.title} (${author.full_name})`
      );

      return { application, venue, author };
    }

    console.log('\nСоздаём одобренные мероприятия...\n');

    for (const item of approvedEvents) {
      const result = await createApplication(
        item,
        'approved'
      );

      if (!result) continue;

      const { application, venue, author } = result;

      await Event.create({
        title: application.title,
        category: application.category,
        description: application.description,
        venue: venue._id,
        startAt: application.startAt,
        endAt: application.endAt,
        capacity: application.capacity,
        registeredCount: 0,
        phone: application.phone,
        organizer: author._id,
        application: application._id,
      });

      eventsCreated++;
      approvedCreated++;

      console.log(`Мероприятие создано: ${item.title}`);
    }

    console.log('\nСоздаём заявки на рассмотрении...\n');

    for (const item of pendingApplications) {
      const result = await createApplication(
        item,
        'pending'
      );

      if (result) pendingCreated++;
    }

    console.log('\nГОТОВО!');
    console.log('Создано мероприятий:', eventsCreated);
    console.log('Одобренных заявок:', approvedCreated);
    console.log('Ожидающих заявок:', pendingCreated);

    console.log('\nВсего в MongoDB:');
    console.log(
      'Мероприятий:',
      await Event.countDocuments()
    );
    console.log(
      'Заявок:',
      await Application.countDocuments()
    );
    console.log(
      'Помещений:',
      await Venue.countDocuments()
    );
  } catch (error) {
    console.error('\nОШИБКА:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
