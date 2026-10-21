import { useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleUserRound,
  Clock3,
  Edit3,
  Eye,
  FileCheck2,
  Headphones,
  Heart,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MoreHorizontal,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  Trash2,
  Upload,
  UserCheck,
  Users,
  X,
} from "lucide-react"
import {
  Link,
  NavLink,
  Outlet,
  createBrowserRouter,
  useLocation,
} from "react-router"

const heroImage =
  "https://images.unsplash.com/photo-1577985043696-8bd54d9f093f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=85&w=1800"

const photos = [
  "https://images.unsplash.com/photo-1619512673224-91cfb2688284?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1000",
  "https://images.unsplash.com/photo-1663162550938-60f70fab5d31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1000",
  "https://images.unsplash.com/photo-1622604647545-0cada2f34470?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1000",
  "https://images.unsplash.com/photo-1730497985274-504ffac6cc66?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1000",
]

type EventItem = {
  id: number
  title: string
  date: string
  time: string
  place: string
  category: string
  status: string
  image: string
}

const events: EventItem[] = [
  {
    id: 1,
    title: "Campus Open Air",
    date: "24 мая",
    time: "18:00",
    place: "Главная площадь",
    category: "Музыка",
    status: "Регистрация открыта",
    image: heroImage,
  },
  {
    id: 2,
    title: "Science Slam",
    date: "28 мая",
    time: "17:30",
    place: "Актовый зал, C1",
    category: "Наука",
    status: "Осталось 8 мест",
    image: photos[1],
  },
  {
    id: 3,
    title: "Design Meetup",
    date: "2 июня",
    time: "16:00",
    place: "Коворкинг, B2",
    category: "Карьера",
    status: "Регистрация открыта",
    image: photos[2],
  },
  {
    id: 4,
    title: "Весенний забег",
    date: "5 июня",
    time: "08:30",
    place: "Стадион кампуса",
    category: "Спорт",
    status: "Мест нет",
    image: photos[3],
  },
  {
    id: 5,
    title: "Квиз: вокруг света",
    date: "8 июня",
    time: "19:00",
    place: "Student Hub",
    category: "Сообщество",
    status: "Регистрация открыта",
    image: photos[0],
  },
  {
    id: 6,
    title: "Лекция о новых медиа",
    date: "12 июня",
    time: "15:00",
    place: "Лекторий A3",
    category: "Образование",
    status: "Регистрация открыта",
    image: photos[1],
  },
]

function Brand() {
  return (
    <Link to="/" className="brand" aria-label="CampusEvents — на главную">
      <span className="brand-mark">
        <Sparkles size={17} strokeWidth={2.5} />
      </span>
      <span>
        Campus<span>Events</span>
      </span>
    </Link>
  )
}

function Button({
  children,
  to,
  variant = "primary",
  type = "button",
  onClick,
  className = "",
}: {
  children: React.ReactNode
  to?: string
  variant?: "primary" | "secondary" | "white" | "danger" | "ghost"
  type?: "button" | "submit"
  onClick?: () => void
  className?: string
}) {
  const classes = `btn btn-${variant} ${className}`
  if (to)
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    )
  return (
    <button type={type} className={classes} onClick={onClick}>
      {children}
    </button>
  )
}

function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Brand />
        <nav className={open ? "nav-links open" : "nav-links"}>
          <NavLink to="/events">Что намечается?</NavLink>
          <NavLink to="/tickets">Мои планы</NavLink>
          <NavLink to="/contacts">Нужна помощь</NavLink>
          <NavLink to="/organizer">Сделать движ</NavLink>
        </nav>
        <div className="nav-actions">
          <button className="icon-button" aria-label="Уведомления">
            <Bell size={19} />
          </button>
          <Button to="/login" variant="secondary">
            Я в деле
          </Button>
          <button
            className="menu-button"
            onClick={() => setOpen(!open)}
            aria-label="Открыть меню"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Brand />
          <p>
            Все события кампуса
            <br />в одном месте.
          </p>
        </div>
        <div>
          <strong>Навигация</strong>
          <Link to="/events">Все мероприятия</Link>
          <Link to="/profile">Личный кабинет</Link>
          <Link to="/organizer">Организаторам</Link>
        </div>
        <div>
          <strong>Поддержка</strong>
          <Link to="/contacts">Контакты</Link>
          <a href="mailto:help@campus.edu">help@campus.edu</a>
          <span>Пн–Пт, 9:00–18:00</span>
        </div>
        <div className="footer-note">
          <span>© 2025 CampusEvents</span>
          <span>Сделано для студентов</span>
        </div>
      </div>
    </footer>
  )
}

function Root() {
  const { pathname } = useLocation()
  const auth = pathname === "/login" || pathname === "/register"
  if (auth) return <Outlet />
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

function DateBadge({ date }: { date: string }) {
  const [day, month] = date.split(" ")
  return (
    <div className="date-badge">
      <strong>{day}</strong>
      <span>{month}</span>
    </div>
  )
}

function EventCard({
  event,
  featured = false,
}: {
  event: EventItem
  featured?: boolean
}) {
  return (
    <Link
      to={`/events/${event.id}`}
      className={featured ? "event-card featured" : "event-card"}
    >
      <div className="event-image">
        <img src={event.image} alt="" />
        <span className="category-pill">{event.category}</span>
        <button
          className="heart"
          aria-label="Добавить в избранное"
          onClick={(e) => e.preventDefault()}
        >
          <Heart size={18} />
        </button>
      </div>
      <div className="event-body">
        <DateBadge date={event.date} />
        <div>
          <h3>{event.title}</h3>
          <p>
            <Clock3 size={15} /> {event.time} <span>·</span>{" "}
            <MapPin size={15} /> {event.place}
          </p>
          <span
            className={event.status === "Мест нет" ? "status full" : "status"}
          >
            {event.status}
          </span>
        </div>
      </div>
    </Link>
  )
}

function Home() {
  return (
    <>
      <div className="campus-pulse">
        <div className="container campus-pulse-inner">
          <span>
            <span className="live-dot" /> Сегодня в кампусе
          </span>
          <Link to="/events/2">17:30 — Science Slam, актовый зал C1</Link>
          <Link to="/events/5">19:00 — Квиз в Student Hub</Link>
          <span className="campus-weather">+19° · можно без куртки</span>
        </div>
      </div>
      <section className="hero">
        <img src={heroImage} alt="Студенты на мероприятии в кампусе" />
        <div className="hero-overlay" />
        <div className="container hero-content">
          <span className="eyebrow light">
            <span /> Главное событие мая
          </span>
          <h1>Campus Open Air</h1>
          <p>
            Встречаем лето на главной площади: три студенческие группы, вечерний
            DJ-сет, еда от локальных проектов и большой общий стол.
          </p>
          <div className="hero-meta">
            <span>
              <CalendarDays /> 24 мая, 18:00
            </span>
            <span>
              <MapPin /> Главная площадь
            </span>
          </div>
          <div className="hero-buttons">
            <Button to="/events/1" variant="white">
              Забрать билет <ArrowRight size={18} />
            </Button>
            <span>Бесплатно · нужен студенческий</span>
          </div>
          <div className="hero-attendance">
            <div className="avatar-stack" aria-hidden="true">
              <span>АК</span>
              <span>МТ</span>
              <span>СВ</span>
              <span>+255</span>
            </div>
            <p>
              <strong>258 студентов уже идут.</strong> Осталось 42 места.
            </p>
          </div>
        </div>
        <div className="hero-stamp">
          <span>24</span>
          <strong>МАЯ</strong>
          <small>суббота</small>
        </div>
      </section>

      <nav className="container quick-links" aria-label="Быстрый выбор событий">
        <span>Куда сегодня?</span>
        <Link to="/events">
          Музыка <strong>12</strong>
        </Link>
        <Link to="/events">
          Лекции <strong>8</strong>
        </Link>
        <Link to="/events">
          Спорт <strong>6</strong>
        </Link>
        <Link to="/events">
          Клубы <strong>15</strong>
        </Link>
        <Link to="/events">
          Волонтёрство <strong>4</strong>
        </Link>
        <Link to="/events">
          Вся афиша <ArrowRight size={15} />
        </Link>
      </nav>

      <section className="section home-events container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Выбор редакции</span>
            <h2>На этой неделе</h2>
          </div>
          <Link to="/events" className="text-link">
            Все 45 событий <ArrowRight size={17} />
          </Link>
        </div>
        <div className="event-grid home-event-grid">
          {events.slice(1, 4).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      <section className="upcoming-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Календарь</span>
              <h2>Следом в афише</h2>
            </div>
            <span className="section-note">Обновлено сегодня в 10:24</span>
          </div>
          <div className="upcoming-list">
            {events.slice(2, 6).map((event) => (
              <Link
                to={`/events/${event.id}`}
                className="upcoming-row"
                key={event.id}
              >
                <DateBadge date={event.date} />
                <div className="upcoming-title">
                  <span>{event.category}</span>
                  <h3>{event.title}</h3>
                </div>
                <div className="upcoming-detail">
                  <Clock3 /> {event.time}
                </div>
                <div className="upcoming-detail">
                  <MapPin /> {event.place}
                </div>
                <ArrowRight className="row-arrow" />
              </Link>
            ))}
          </div>
          <div className="center">
            <Button to="/events">
              Открыть календарь <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </section>

      <section className="campus-board container">
        <div className="board-heading">
          <div>
            <span className="eyebrow">Между парами</span>
            <h2>Что обсуждают в кампусе</h2>
          </div>
          <p>Новости от клубов, организаторов и таких же студентов, как ты.</p>
        </div>
        <div className="board-grid">
          <article className="board-card board-card-wide">
            <span className="board-label">Набор открыт до пятницы</span>
            <h3>Медиаклуб ищет фотографов на летние события</h3>
            <p>
              Можно без опыта — первая встреча команды уже 23 мая в B2. Покажем
              технику и распределим первые съёмки.
            </p>
            <div className="board-meta">
              <span>Медиаклуб</span>
              <span>18 откликов</span>
            </div>
          </article>
          <article className="board-card board-card-quote">
            <span className="board-label">После события</span>
            <blockquote>
              «На дебатах было тесно, зато никто не ушёл до конца. В июне
              повторяем»
            </blockquote>
            <div className="board-meta">
              <span>Саша, 2 курс</span>
              <span>2 часа назад</span>
            </div>
          </article>
          <article className="board-card board-card-list">
            <span className="board-label">Коротко</span>
            <h3>Ещё три повода выйти из общаги</h3>
            <Link to="/events">
              Обмен книгами у библиотеки <ArrowRight />
            </Link>
            <Link to="/events">
              Открытая тренировка по волейболу <ArrowRight />
            </Link>
            <Link to="/events">
              Киноклуб смотрит «Патерсон» <ArrowRight />
            </Link>
          </article>
          <div className="board-number">
            <strong>1 284</strong>
            <span>студента нашли здесь событие за май</span>
          </div>
        </div>
      </section>

      <section className="newsletter">
        <div className="container newsletter-inner">
          <div>
            <span className="eyebrow light">Будь в теме</span>
            <h2>
              Афиша на неделю —
              <br />
              по понедельникам.
            </h2>
            <p className="newsletter-note">
              Одно письмо, 7–10 событий и никаких «уникальных возможностей».
            </p>
          </div>
          <form className="subscribe" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Твоя университетская почта"
              aria-label="Электронная почта"
            />
            <Button type="submit" variant="white">
              Держите меня в курсе
            </Button>
          </form>
        </div>
      </section>
    </>
  )
}

function EventsPage() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("Все")
  const filtered = useMemo(
    () =>
      events.filter(
        (event) =>
          event.title.toLowerCase().includes(query.toLowerCase()) &&
          (category === "Все" || event.category === category),
      ),
    [query, category],
  )
  const categories = [
    "Все",
    "Музыка",
    "Наука",
    "Спорт",
    "Карьера",
    "Сообщество",
  ]
  return (
    <div className="page-shell container">
      <div className="page-title">
        <div>
          <span className="eyebrow">Афиша кампуса</span>
          <h1>Куда идём?</h1>
          <p>Концерты, квизы, спорт и новые люди. Выбирай свой вайб.</p>
        </div>
        <span className="event-count">{filtered.length} событий</span>
      </div>
      <div className="filter-panel">
        <label className="search-field">
          <Search />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Что ищем?"
          />
        </label>
        <button className="filter-select">
          <CalendarDays /> Любая дата <ChevronDown />
        </button>
        <button className="filter-select">
          Сначала ближайшие <ChevronDown />
        </button>
      </div>
      <div className="chips">
        {categories.map((item) => (
          <button
            key={item}
            className={category === item ? "chip active" : "chip"}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="event-grid catalog-grid">
        {filtered.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="empty-state">
          <Search />
          <h3>Ничего не найдено</h3>
          <p>Попробуйте изменить запрос или фильтры.</p>
        </div>
      )}
    </div>
  )
}

function EventDetail() {
  const [registered, setRegistered] = useState(false)
  return (
    <div className="detail-page">
      <div className="detail-hero">
        <img src={heroImage} alt="Campus Open Air" />
        <div className="detail-overlay" />
        <div className="container detail-hero-content">
          <Link to="/events" className="back-link">
            <ArrowLeft /> Все мероприятия
          </Link>
          <span className="category-pill static">Музыка</span>
          <h1>Campus Open Air</h1>
          <p>Большой летний вечер, который мы проведём вместе.</p>
        </div>
      </div>
      <div className="container detail-layout">
        <article className="detail-article">
          <h2>Что за движ?</h2>
          <p>
            Закрываем учебный сезон громко! Campus Open Air — это музыка,
            фуд-корт от студенческих проектов, творческие зоны и много новых
            знакомств. Приходи с друзьями или один — здесь каждый найдёт свою
            компанию.
          </p>
          <p>
            На сцене выступят студенческие группы и приглашённый хедлайнер. Не
            забудь зарегистрироваться: количество мест ограничено.
          </p>
          <h2>Что тебя ждёт</h2>
          <div className="feature-list">
            {[
              "Живая музыка и DJ-сет",
              "Фуд-корт и зона отдыха",
              "Игры и студенческие активности",
              "Фотозона и подарки",
            ].map((x) => (
              <span key={x}>
                <CheckCircle2 /> {x}
              </span>
            ))}
          </div>
          <div className="organizer-card">
            <div className="avatar">SC</div>
            <div>
              <small>Организатор</small>
              <strong>Student Community</strong>
              <span>student.community@campus.edu</span>
            </div>
          </div>
        </article>
        <aside className="booking-card">
          <div className="booking-date">
            <DateBadge date="24 мая" />
            <div>
              <strong>Суббота</strong>
              <span>18:00–22:00</span>
            </div>
          </div>
          <div className="booking-info">
            <MapPin />
            <div>
              <strong>Главная площадь</strong>
              <span>Открытая площадка кампуса</span>
            </div>
          </div>
          <div className="capacity">
            <div>
              <span>Свободно 42 из 300 мест</span>
              <strong>86%</strong>
            </div>
            <div className="progress">
              <span />
            </div>
          </div>
          <Button className="wide" onClick={() => setRegistered(true)}>
            {registered ? (
              <>
                <Check /> Ты в списке!
              </>
            ) : (
              <>
                Я иду! <ArrowRight />
              </>
            )}
          </Button>
          <p className="booking-note">
            <ShieldCheck /> Билет появится в личном кабинете
          </p>
        </aside>
      </div>
      <section className="container gallery-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Как это было</span>
            <h2>Фото и отзывы</h2>
          </div>
          <Button to="/events/1/reviews" variant="secondary">
            Смотреть отзывы
          </Button>
        </div>
        <div className="gallery-grid">
          {photos.map((photo, i) => (
            <img
              src={photo}
              alt={`Участники мероприятия ${i + 1}`}
              key={photo}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function AuthPage({ register = false }: { register?: boolean }) {
  const [success, setSuccess] = useState(false)
  return (
    <div className="auth-layout">
      <div className="auth-visual">
        <img src={heroImage} alt="" />
        <div className="auth-visual-overlay" />
        <Link to="/" className="auth-brand">
          <Brand />
        </Link>
        <blockquote>
          «Кампус — это не только пары.
          <br />
          Это люди, идеи и моменты.»
        </blockquote>
        <span>Campus life, made better.</span>
      </div>
      <div className="auth-form-wrap">
        <div className="auth-form">
          <Link to="/" className="mobile-brand">
            <Brand />
          </Link>
          <span className="eyebrow">
            {register ? "Новый аккаунт" : "С возвращением"}
          </span>
          <h1>{register ? "Создай аккаунт" : "Войди в CampusEvents"}</h1>
          <p>
            {register
              ? "Используй университетскую почту для регистрации."
              : "Продолжай открывать новые события кампуса."}
          </p>
          {success && (
            <div className="success-banner">
              <CheckCircle2 /> Аккаунт успешно создан
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (register) setSuccess(true)
            }}
          >
            {register && (
              <div className="field-row">
                <label>
                  Имя
                  <input placeholder="Алия" required />
                </label>
                <label>
                  Фамилия
                  <input placeholder="Ким" required />
                </label>
              </div>
            )}
            {register && (
              <label>
                ИИН
                <input placeholder="12 цифр" required />
              </label>
            )}
            <label>
              {register
                ? "Университетская почта"
                : "Логин или электронная почта"}
              <input type="email" placeholder="name@campus.edu" required />
            </label>
            <label>
              Пароль
              <input
                type="password"
                placeholder="Не менее 8 символов"
                required
              />
            </label>
            {register && (
              <label>
                Подтверждение пароля
                <input
                  type="password"
                  placeholder="Повторите пароль"
                  required
                />
              </label>
            )}
            {!register && (
              <Link to="/contacts" className="forgot">
                Забыли пароль?
              </Link>
            )}
            <Button type="submit" className="wide">
              {register ? "Зарегистрироваться" : "Войти"} <ArrowRight />
            </Button>
          </form>
          <div className="auth-switch">
            {register ? "Уже есть аккаунт?" : "Ещё нет аккаунта?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Войти" : "Зарегистрироваться"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const profileNav = [
  [LayoutDashboard, "Обзор", "/profile"],
  [Ticket, "Мои билеты", "/tickets"],
  [Star, "Мои отзывы", "/events/1/reviews"],
  [CircleUserRound, "Настройки", "/profile"],
]

function Profile() {
  return (
    <div className="account-bg">
      <div className="container account-layout">
        <aside className="account-sidebar">
          <div className="profile-mini">
            <div className="avatar large">АК</div>
            <div>
              <strong>Алия Ким</strong>
              <span>Студент · 3 курс</span>
            </div>
          </div>
          <nav>
            {profileNav.map(([Icon, label, to]) => (
              <Link
                to={to as string}
                className={label === "Обзор" ? "active" : ""}
                key={label as string}
              >
                <Icon size={19} />
                {label as string}
              </Link>
            ))}
          </nav>
          <Link to="/login" className="logout">
            <LogOut /> Выйти
          </Link>
        </aside>
        <div className="account-main">
          <div className="dashboard-welcome">
            <div>
              <span>Личный кабинет</span>
              <h1>Привет, Алия!</h1>
              <p>Вот что происходит в твоём CampusEvents.</p>
            </div>
            <Button to="/events">
              Найти события <ArrowRight />
            </Button>
          </div>
          <div className="stats-grid">
            {[
              ["3", "предстоящих события", CalendarDays],
              ["12", "мероприятий посещено", CheckCircle2],
              ["4.8", "средняя оценка", Star],
            ].map(([value, label, Icon]) => (
              <div className="stat-card" key={label as string}>
                <Icon />
                <strong>{value as string}</strong>
                <span>{label as string}</span>
              </div>
            ))}
          </div>
          <div className="panel">
            <div className="panel-heading">
              <h2>Предстоящие мероприятия</h2>
              <Link to="/tickets">
                Все билеты <ArrowRight />
              </Link>
            </div>
            {events.slice(0, 3).map((event) => (
              <div className="mini-event" key={event.id}>
                <img src={event.image} alt="" />
                <DateBadge date={event.date} />
                <div>
                  <strong>{event.title}</strong>
                  <span>
                    <Clock3 /> {event.time} · <MapPin /> {event.place}
                  </span>
                </div>
                <span className="status">Билет активен</span>
                <MoreHorizontal />
              </div>
            ))}
          </div>
          <div className="panel">
            <div className="panel-heading">
              <h2>История посещений</h2>
              <span>12 событий</span>
            </div>
            <div className="history-row">
              <CheckCircle2 />
              <div>
                <strong>День карьеры 2025</strong>
                <span>18 апреля · Оценка 5.0</span>
              </div>
              <Button to="/events/1/reviews" variant="ghost">
                Оставить отзыв
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TicketsPage() {
  return (
    <div className="page-shell container narrow-page">
      <div className="page-title">
        <div>
          <span className="eyebrow">Личный кабинет</span>
          <h1>Мои планы</h1>
          <p>Всё самое интересное уже ждёт. QR-код покажешь на входе.</p>
        </div>
      </div>
      <div className="ticket-tabs">
        <button className="active">
          Предстоящие <span>3</span>
        </button>
        <button>
          Использованные <span>12</span>
        </button>
        <button>Отменённые</button>
      </div>
      <div className="tickets-list">
        {events.slice(0, 3).map((event, index) => (
          <div className="ticket-card" key={event.id}>
            <img src={event.image} alt="" />
            <div className="ticket-content">
              <span className="status">
                <CheckCircle2 /> Действителен
              </span>
              <h2>{event.title}</h2>
              <p>
                <CalendarDays /> {event.date}, {event.time}
              </p>
              <p>
                <MapPin /> {event.place}
              </p>
              <small>Билет № CE-2025-00{event.id}</small>
            </div>
            <div className="ticket-cut" />
            <div className="qr-wrap">
              <QrCode />
              <strong>CE{4821 + index * 57}</strong>
              <span>Персональный билет</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReviewsPage() {
  const [rating, setRating] = useState(0)
  return (
    <div className="page-shell container">
      <Link to="/events/1" className="back-link dark">
        <ArrowLeft /> Campus Open Air
      </Link>
      <div className="reviews-header">
        <div>
          <span className="eyebrow">Впечатления участников</span>
          <h1>Как всё прошло?</h1>
          <p>Показывай фото, ставь звёзды и делись впечатлениями.</p>
        </div>
        <div className="rating-summary">
          <strong>4.8</strong>
          <div>
            <span>
              {[1, 2, 3, 4, 5].map((x) => (
                <Star key={x} fill="currentColor" />
              ))}
            </span>
            <small>На основе 126 отзывов</small>
          </div>
        </div>
      </div>
      <div className="reviews-layout">
        <div>
          <div className="review-form panel">
            <h2>Оставить отзыв</h2>
            <p className="verified">
              <ShieldCheck /> Посещение подтверждено
            </p>
            <label>
              Ваша оценка
              <div className="star-input">
                {[1, 2, 3, 4, 5].map((x) => (
                  <button key={x} onClick={() => setRating(x)}>
                    <Star fill={x <= rating ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </label>
            <label>
              Расскажите о впечатлениях
              <textarea placeholder="Что вам понравилось? Что можно улучшить?" />
            </label>
            <div className="upload-zone">
              <ImagePlus />
              <span>Добавить фотографии</span>
              <small>JPG или PNG, до 10 МБ</small>
            </div>
            <Button>Опубликовать отзыв</Button>
          </div>
          {[
            [
              "Данияр Омаров",
              "Это был лучший вечер семестра! Отличная музыка и очень тёплая атмосфера.",
              "ДО",
            ],
            [
              "София Ли",
              "Организация на высоте. Особенно понравилась зона студенческих проектов.",
              "СЛ",
            ],
          ].map((r, i) => (
            <div className="review-card" key={r[0]}>
              <div className="avatar">{r[2]}</div>
              <div>
                <div className="review-meta">
                  <strong>{r[0]}</strong>
                  <span>
                    {[1, 2, 3, 4, 5].map((x) => (
                      <Star key={x} fill="currentColor" />
                    ))}
                  </span>
                  <small>{i ? "3 дня назад" : "Вчера"}</small>
                </div>
                <p>{r[1]}</p>
              </div>
            </div>
          ))}
        </div>
        <aside>
          <h2>Галерея участников</h2>
          <div className="side-gallery">
            {photos.map((x) => (
              <img src={x} alt="Фотография участника" key={x} />
            ))}
            <div>
              <Upload />
              <span>38 фото</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function ContactsPage() {
  return (
    <div className="page-shell container">
      <div className="contacts-hero">
        <span className="eyebrow">Мы на связи</span>
        <h1>Эй, поможем!</h1>
        <p>
          Поможем с публикацией мероприятия, регистрацией
          <br />
          или техническим вопросом.
        </p>
      </div>
      <div className="contact-grid">
        <div className="contact-card accent">
          <Headphones />
          <span>Техническая поддержка</span>
          <h2>Есть проблема с сайтом?</h2>
          <p>Напишите нам — обычно отвечаем в течение рабочего часа.</p>
          <a href="mailto:help@campus.edu">
            help@campus.edu <ArrowRight />
          </a>
        </div>
        {[
          [
            "Согласование мероприятий",
            "Айгуль Сериковна Нурова",
            "Руководитель отдела внеучебной работы",
            "Кабинет C-214",
            "events@campus.edu",
          ],
          [
            "Поддержка организаторов",
            "Марат Жанибеков",
            "Координатор студенческих клубов",
            "Кабинет B-108",
            "clubs@campus.edu",
          ],
        ].map((x) => (
          <div className="contact-card" key={x[0]}>
            <span>{x[0]}</span>
            <div className="avatar large">
              {x[1]
                .split(" ")
                .map((y) => y[0])
                .slice(0, 2)
                .join("")}
            </div>
            <h2>{x[1]}</h2>
            <p>{x[2]}</p>
            <div className="contact-lines">
              <span>
                <MapPin /> {x[3]}
              </span>
              <a href={`mailto:${x[4]}`}>
                <Mail /> {x[4]}
              </a>
            </div>
          </div>
        ))}
      </div>
      <section className="instruction">
        <div>
          <span className="eyebrow">Для организаторов</span>
          <h2>Как опубликовать событие</h2>
          <p>От идеи до публикации — всего несколько понятных шагов.</p>
          <Button to="/organizer/events/new">
            Создать мероприятие <ArrowRight />
          </Button>
        </div>
        <ol>
          {[
            "Заполните информацию и добавьте афишу",
            "Отправьте заявку на согласование",
            "Получите ответ в течение 2 рабочих дней",
            "После одобрения событие появится в афише",
          ].map((x, i) => (
            <li key={x}>
              <span>0{i + 1}</span>
              {x}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

type SectionConfig = {
  title: string;
  label: string;
  description: string;
};

const organizerNav = [
  [LayoutDashboard, "Панель", "/organizer"],
  [CalendarDays, "Мероприятия", "/organizer"],
  [Users, "Участники", "/organizer/events/1/attendees"],
]
const adminNav = [
  [LayoutDashboard, "Обзор", "/admin"],
  [FileCheck2, "Заявки", "/admin/requests"],
  [CalendarDays, "Мероприятия", "/admin/events"],
  [Users, "Пользователи", "/admin/users"],
  [ShieldCheck, "Модерация", "/admin/moderation"],
  [Mail, "Контакты", "/admin/contacts"],
]

function DashboardLayout({
  admin = false,
  children,
}: {
  admin?: boolean
  children: React.ReactNode
}) {
  const nav = admin ? adminNav : organizerNav
  return (
    <div className="dash-bg">
      <div className="container dashboard-layout">
        <aside className="dash-sidebar">
          <div className="role-label">
            {admin ? "Администрирование" : "Организатор"}
          </div>
          <nav>
            {nav.map(([Icon, label, to]) => (
              <NavLink end to={to as string} key={label as string}>
                <Icon size={18} />
                {label as string}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="dash-main">{children}</div>
      </div>
    </div>
  )
}

function Organizer() {
  return (
    <DashboardLayout>
      <DashboardHeader
        label="Панель организатора"
        title="Ваши мероприятия"
        action="Создать событие"
        to="/organizer/events/new"
      />
      <div className="stats-grid four">
        {[
          ["8", "Всего событий", CalendarDays],
          ["3", "На модерации", Clock3],
          ["642", "Регистрации", Users],
          ["78%", "Средняя явка", BarChart3],
        ].map(([v, l, I]) => (
          <div className="stat-card" key={l as string}>
            <I />
            <strong>{v as string}</strong>
            <span>{l as string}</span>
          </div>
        ))}
      </div>
      <EventManagementTable organizer />
    </DashboardLayout>
  )
}

function DashboardHeader({
  label,
  title,
  action,
  to,
}: {
  label: string
  title: string
  action?: string
  to?: string
}) {
  return (
    <div className="dashboard-header">
      <div>
        <span>{label}</span>
        <h1>{title}</h1>
      </div>
      {action && (
        <Button to={to}>
          <Plus /> {action}
        </Button>
      )}
    </div>
  )
}

function EventManagementTable({ organizer = false }: { organizer?: boolean }) {
  return (
    <div className="panel table-panel">
      <div className="panel-heading">
        <h2>{organizer ? "Последние мероприятия" : "Все мероприятия"}</h2>
        <div className="small-search">
          <Search />
          <input placeholder="Поиск" />
        </div>
      </div>
      <div className="data-table">
        <div className="table-head">
          <span>Мероприятие</span>
          <span>Дата</span>
          <span>Статус</span>
          <span>Участники</span>
          <span />
        </div>
        {events.slice(0, 5).map((e, i) => (
          <div className="table-row" key={e.id}>
            <div className="table-event">
              <img src={e.image} alt="" />
              <strong>{e.title}</strong>
            </div>
            <span>
              {e.date}, {e.time}
            </span>
            <span
              className={`tag ${i === 1 ? "warning" : i === 3 ? "muted" : ""}`}
            >
              {i === 1 ? "На модерации" : i === 3 ? "Черновик" : "Опубликовано"}
            </span>
            <span>
              {[214, 86, 142, 0, 63][i]} / {[300, 100, 180, 80, 120][i]}
            </span>
            <div className="row-actions">
              <Link to={`/organizer/events/${e.id}/edit`}>
                <Edit3 />
              </Link>
              <Link to={`/events/${e.id}`}>
                <Eye />
              </Link>
              <MoreHorizontal />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EventForm({ edit = false }: { edit?: boolean }) {
  return (
    <DashboardLayout>
      <Link className="back-link dark" to="/organizer">
        <ArrowLeft /> Назад к мероприятиям
      </Link>
      <DashboardHeader
        label={edit ? "Редактирование" : "Новое мероприятие"}
        title={edit ? "Campus Open Air" : "Создать мероприятие"}
      />
      <form className="event-form" onSubmit={(e) => e.preventDefault()}>
        <div className="form-panel">
          <h2>Основная информация</h2>
          <label>
            Название мероприятия
            <input
              defaultValue={edit ? "Campus Open Air" : ""}
              placeholder="Например, Science Slam 2025"
            />
          </label>
          <label>
            Описание
            <textarea
              defaultValue={
                edit ? "Большой летний вечер для всего кампуса." : ""
              }
              placeholder="Расскажите, что ждёт участников"
            />
          </label>
          <div className="field-row">
            <label>
              Категория
              <select defaultValue="Музыка">
                <option>Музыка</option>
                <option>Наука</option>
                <option>Спорт</option>
                <option>Карьера</option>
              </select>
            </label>
            <label>
              Количество мест
              <input
                type="number"
                defaultValue={edit ? 300 : undefined}
                placeholder="100"
              />
            </label>
          </div>
          <div className="field-row">
            <label>
              Дата
              <input type="date" defaultValue={edit ? "2025-05-24" : ""} />
            </label>
            <label>
              Время
              <input type="time" defaultValue={edit ? "18:00" : ""} />
            </label>
          </div>
          <label>
            Место проведения
            <input
              defaultValue={edit ? "Главная площадь" : ""}
              placeholder="Корпус, аудитория или площадка"
            />
          </label>
        </div>
        <div className="form-side">
          <div className="form-panel">
            <h2>Обложка</h2>
            <div className="cover-upload">
              {edit ? (
                <img src={heroImage} alt="Обложка" />
              ) : (
                <>
                  <ImagePlus />
                  <strong>Загрузите афишу</strong>
                  <span>PNG, JPG · до 10 МБ</span>
                </>
              )}
              <Button variant="secondary">
                <Upload /> Выбрать файл
              </Button>
            </div>
          </div>
          {edit && (
            <div className="admin-note">
              <strong>Комментарий администратора</strong>
              <p>
                Уточните время окончания мероприятия и добавьте информацию о
                фуд-корте.
              </p>
            </div>
          )}
          <Button className="wide">
            {edit ? "Повторно отправить" : "Отправить на утверждение"}{" "}
            <ArrowRight />
          </Button>
          <Button className="wide" variant="ghost">
            Сохранить черновик
          </Button>
        </div>
      </form>
    </DashboardLayout>
  )
}

function Attendees() {
  const [scanned, setScanned] = useState(false)
  return (
    <DashboardLayout>
      <Link className="back-link dark" to="/organizer">
        <ArrowLeft /> Campus Open Air
      </Link>
      <DashboardHeader
        label="24 мая · Главная площадь"
        title="Участники мероприятия"
      />
      <div className="attendee-top">
        <div className="capacity-card">
          <span>Зарегистрировано</span>
          <strong>
            258 <small>/ 300</small>
          </strong>
          <div className="progress">
            <span />
          </div>
          <p>42 свободных места</p>
        </div>
        <div className="scan-card">
          <QrCode />
          <div>
            <strong>Проверка билета</strong>
            <span>
              {scanned
                ? "Билет действителен. Алия Ким отмечена."
                : "Сканируйте QR-код участника"}
            </span>
          </div>
          <Button onClick={() => setScanned(true)}>
            {scanned ? (
              <>
                <Check /> Посещение отмечено
              </>
            ) : (
              "Открыть сканер"
            )}
          </Button>
        </div>
      </div>
      <div className="panel table-panel">
        <div className="panel-heading">
          <h2>Список студентов</h2>
          <div className="small-search">
            <Search />
            <input placeholder="Имя или номер билета" />
          </div>
        </div>
        <div className="data-table attendees-table">
          <div className="table-head">
            <span>Участник</span>
            <span>Билет</span>
            <span>Регистрация</span>
            <span>Посещение</span>
          </div>
          {["Алия Ким", "Данияр Омаров", "София Ли", "Арман Садыков"].map(
            (name, i) => (
              <div className="table-row" key={name}>
                <div className="user-cell">
                  <div className="avatar">
                    {name
                      .split(" ")
                      .map((x) => x[0])
                      .join("")}
                  </div>
                  <div>
                    <strong>{name}</strong>
                    <span>student{i + 12}@campus.edu</span>
                  </div>
                </div>
                <span>CE-2025-0{481 + i}</span>
                <span>18 мая, 14:{20 + i * 7}</span>
                <span className={`tag ${i > 1 ? "warning" : ""}`}>
                  {i > 1 ? "Ожидается" : "Посещено"}
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

function Admin() {
  return (
    <DashboardLayout admin>
      <DashboardHeader label="Администрирование" title="Обзор платформы" />
      <div className="stats-grid four">
        {[
          ["48", "Мероприятий", CalendarDays],
          ["3 842", "Пользователя", Users],
          ["7 216", "Регистраций", Ticket],
          ["84%", "Средняя явка", BarChart3],
        ].map(([v, l, I]) => (
          <div className="stat-card" key={l as string}>
            <I />
            <strong>{v as string}</strong>
            <span>{l as string}</span>
          </div>
        ))}
      </div>
      <div className="admin-grid">
        <div className="panel">
          <div className="panel-heading">
            <h2>Новые заявки</h2>
            <Link to="/admin/requests">Все заявки</Link>
          </div>
          {events.slice(0, 3).map((e, i) => (
            <div className="request-row" key={e.id}>
              <img src={e.image} alt="" />
              <div>
                <strong>{e.title}</strong>
                <span>Student Club · {i + 1} ч назад</span>
              </div>
              <span className="tag warning">На проверке</span>
            </div>
          ))}
        </div>
        <div className="panel activity-panel">
          <div className="panel-heading">
            <h2>Активность</h2>
          </div>
          {[
            ["+126", "регистраций сегодня"],
            ["14", "новых пользователей"],
            ["8", "отзывов опубликовано"],
          ].map((x) => (
            <div key={x[1]}>
              <strong>{x[0]}</strong>
              <span>{x[1]}</span>
            </div>
          ))}
        </div>
      </div>
      <EventManagementTable />
    </DashboardLayout>
  )
}

function RequestsPage() {
  const [notice, setNotice] = useState("")
  return (
    <DashboardLayout admin>
      <DashboardHeader label="Модерация" title="Заявки на мероприятия" />
      {notice && (
        <div className="success-banner">
          <CheckCircle2 />
          {notice}
        </div>
      )}
      <div className="request-cards">
        {events.slice(0, 3).map((e, i) => (
          <div className="approval-card" key={e.id}>
            <img src={e.image} alt="" />
            <div className="approval-info">
              <span className="tag warning">На проверке · {i + 1} день</span>
              <h2>{e.title}</h2>
              <p>Организатор: Student Community</p>
              <div>
                <span>
                  <CalendarDays />
                  {e.date}, {e.time}
                </span>
                <span>
                  <MapPin />
                  {e.place}
                </span>
                <span>
                  <Users />
                  до {150 + i * 50} участников
                </span>
              </div>
            </div>
            <div className="approval-actions">
              <Button variant="secondary">
                <Eye /> Подробнее
              </Button>
              <Button
                onClick={() => setNotice(`Событие «${e.title}» одобрено`)}
              >
                <Check /> Одобрить
              </Button>
              <Button variant="danger">
                <X /> Отклонить
              </Button>
              <Button variant="ghost">
                <Edit3 /> На исправление
              </Button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}

function AdminUsers() {
  return (
    <DashboardLayout admin>
      <DashboardHeader
        label="Доступ и безопасность"
        title="Пользователи и роли"
        action="Добавить пользователя"
      />
      <div className="filter-panel compact">
        <label className="search-field">
          <Search />
          <input placeholder="Поиск по имени или почте" />
        </label>
        <button className="filter-select">
          Все роли <ChevronDown />
        </button>
      </div>
      <div className="panel table-panel">
        <div className="data-table users-table">
          <div className="table-head">
            <span>Пользователь</span>
            <span>Роль</span>
            <span>Статус</span>
            <span>Последний вход</span>
            <span />
          </div>
          {[
            "Алия Ким",
            "Марат Жанибеков",
            "Айгуль Нурова",
            "Данияр Омаров",
            "София Ли",
          ].map((name, i) => (
            <div className="table-row" key={name}>
              <div className="user-cell">
                <div className="avatar">
                  {name
                    .split(" ")
                    .map((x) => x[0])
                    .join("")}
                </div>
                <div>
                  <strong>{name}</strong>
                  <span>user{i + 1}@campus.edu</span>
                </div>
              </div>
              <span className="tag">
                {i === 2
                  ? "Администратор"
                  : i === 1
                    ? "Организатор"
                    : "Студент"}
              </span>
              <span className="status">Активен</span>
              <span>{i + 1} ч назад</span>
              <MoreHorizontal />
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

function Moderation() {
  return (
    <DashboardLayout admin>
      <DashboardHeader label="Контент" title="Модерация отзывов и фото" />
      <div className="ticket-tabs">
        <button className="active">
          Жалобы <span>4</span>
        </button>
        <button>Отзывы</button>
        <button>Фотографии</button>
      </div>
      <div className="moderation-grid">
        {photos.map((p, i) => (
          <div className="moderation-card" key={p}>
            <img src={p} alt="Контент на модерации" />
            <div>
              <span className="tag warning">
                Жалоба: {i % 2 ? "Спам" : "Неподходящий контент"}
              </span>
              <p>Загружено пользователем · {i + 2} ч назад</p>
              <div>
                <Button variant="secondary">
                  <Eye /> Просмотр
                </Button>
                <Button variant="danger">
                  <Trash2 /> Удалить
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}

function AdminContacts() {
  return (
    <DashboardLayout admin>
      <DashboardHeader
        label="Служебная информация"
        title="Ответственные контакты"
        action="Добавить контакт"
      />
      <div className="admin-contact-list">
        {[
          "Айгуль Сериковна Нурова",
          "Марат Жанибеков",
          "Техническая поддержка",
        ].map((name, i) => (
          <div className="panel admin-contact" key={name}>
            <div className="avatar large">
              {i === 2
                ? "IT"
                : name
                    .split(" ")
                    .map((x) => x[0])
                    .slice(0, 2)
                    .join("")}
            </div>
            <div>
              <span>
                {i === 0
                  ? "Согласование мероприятий"
                  : i === 1
                    ? "Студенческие клубы"
                    : "Поддержка платформы"}
              </span>
              <h2>{name}</h2>
              <p>
                {i === 2 ? "help@campus.edu" : "contact@campus.edu"} · Кабинет{" "}
                {i === 0 ? "C-214" : i === 1 ? "B-108" : "A-012"}
              </p>
            </div>
            <Button variant="secondary">
              <Edit3 /> Редактировать
            </Button>
            <button className="icon-button">
              <MoreHorizontal />
            </button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}

function NotFound() {
  return (
    <div className="empty-state not-found">
      <strong>404</strong>
      <h1>Такой страницы нет</h1>
      <p>Но интересные события точно есть.</p>
      <Button to="/events">Перейти к мероприятиям</Button>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "events", Component: EventsPage },
      { path: "events/:id", Component: EventDetail },
      { path: "events/:id/reviews", Component: ReviewsPage },
      { path: "login", Component: () => <AuthPage /> },
      { path: "register", Component: () => <AuthPage register /> },
      { path: "profile", Component: Profile },
      { path: "tickets", Component: TicketsPage },
      { path: "contacts", Component: ContactsPage },
      { path: "organizer", Component: Organizer },
      { path: "organizer/events/new", Component: () => <EventForm /> },
      {
        path: "organizer/events/:id/edit",
        Component: () => <EventForm edit />,
      },
      { path: "organizer/events/:id/attendees", Component: Attendees },
      { path: "admin", Component: Admin },
      { path: "admin/requests", Component: RequestsPage },
      {
        path: "admin/events",
        Component: () => (
          <DashboardLayout admin>
            <DashboardHeader label="Управление" title="Все мероприятия" />
            <EventManagementTable />
          </DashboardLayout>
        ),
      },
      { path: "admin/users", Component: AdminUsers },
      { path: "admin/moderation", Component: Moderation },
      { path: "admin/contacts", Component: AdminContacts },
      { path: "*", Component: NotFound },
    ],
  },
])
