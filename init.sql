-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    iin VARCHAR(12) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('student', 'organizer', 'admin')) DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы мероприятий
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    organizer_id INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы регистраций на мероприятия
CREATE TABLE IF NOT EXISTS registrations (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    event_id INT REFERENCES events(id) ON DELETE CASCADE,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_event UNIQUE (user_id, event_id)
);

-- Добавление 20 тестовых пользователей (админ, организаторы, студенты с уникальными ИИН)
INSERT INTO users (iin, full_name, email, role) VALUES
('000101400001', 'Админ Администраторович', 'admin1@uni.kz', 'admin'),
('950505300123', 'Айгерим Смагулова', 'organizer1@uni.kz', 'organizer'),
('920202300456', 'Тимур Бекмамбетов', 'organizer2@uni.kz', 'organizer'),
('880303300789', 'Динара Жандосова', 'organizer3@uni.kz', 'organizer'),
('040101500001', 'Алихан Каримов', 'student1@uni.kz', 'student'),
('040202500002', 'Мадина Оспанова', 'student2@uni.kz', 'student'),
('040303500003', 'Ернар Сапар', 'student3@uni.kz', 'student'),
('040404500004', 'Камила Ахметова', 'student4@uni.kz', 'student'),
('040505500005', 'Руслан Серик', 'student5@uni.kz', 'student'),
('040606500006', 'Асель Токтарова', 'student6@uni.kz', 'student'),
('040707500007', 'Дамир Ибраев', 'student7@uni.kz', 'student'),
('040808500008', 'Жанель Мурат', 'student8@uni.kz', 'student'),
('040909500009', 'Санжар Кенес', 'student9@uni.kz', 'student'),
('041010500010', 'Томирис Назар', 'student10@uni.kz', 'student'),
('041111500011', 'Арман Жумабаев', 'student11@uni.kz', 'student'),
('041212500012', 'Зарина Нурлан', 'student12@uni.kz', 'student'),
('050101500013', 'Бексултан Ерболат', 'student13@uni.kz', 'student'),
('050202500014', 'Айнур Кожа', 'student14@uni.kz', 'student'),
('050303500015', 'Нурсултан Аман', 'student15@uni.kz', 'student'),
('050404500016', 'Лейла Ким', 'student16@uni.kz', 'student')
ON CONFLICT (iin) DO NOTHING;

-- Добавление тестовых мероприятий
INSERT INTO events (title, description, event_date, organizer_id) VALUES
('Hackathon 2026', 'Ежегодный университетский хакатон по разработке.', '2026-11-10 10:00:00', 2),
('IT Career Fair', 'Ярмарка вакансий ведущих IT-компаний.', '2026-11-15 09:30:00', 3),
('AI & Machine Learning Workshop', 'Мастер-класс по внедрению нейросетей.', '2026-11-20 14:00:00', 4);

-- Добавление связей (регистраций)
INSERT INTO registrations (user_id, event_id) VALUES
(5, 1), (6, 1), (7, 1),
(5, 2), (8, 2),
(9, 3), (10, 3)
ON CONFLICT DO NOTHING;