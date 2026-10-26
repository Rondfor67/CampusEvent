
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEvents } from '../services/api';
import EventCard from '../components/EventCard';

function getUser() {
  try {
    if (!localStorage.getItem('token')) return null;
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(getUser);

  // Загрузка активных мероприятий
  useEffect(() => {
    getEvents()
      .then(setEvents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Обновление данных пользователя
  useEffect(() => {
    function updateAuth() {
      setUser(getUser());
    }

    window.addEventListener('authChanged', updateAuth);
    window.addEventListener('auth-change', updateAuth);
    window.addEventListener('storage', updateAuth);

    return () => {
      window.removeEventListener('authChanged', updateAuth);
      window.removeEventListener('auth-change', updateAuth);
      window.removeEventListener('storage', updateAuth);
    };
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-shade" />

        <div className="hero-content container">
          <span className="eyebrow">✦ CAMPUS LIFE</span>

          <h1>
            Твоя студенческая<br />
            жизнь начинается<br />
            здесь.
          </h1>

          <p>
            Новые знакомства, яркие впечатления и мероприятия,
            которые ты не захочешь пропустить.
          </p>

          <div className="hero-actions">
            <Link className="btn btn-primary" to="/events">
              Исследовать мероприятия ↗
            </Link>

            {!isAdmin && (
              <Link
                className="btn hero-create-btn"
                to={user ? '/events/create' : '/login'}
                state={
                  !user
                    ? { from: '/events/create' }
                    : undefined
                }
              >
                + Создать мероприятие
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="events-section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">НЕ ПРОПУСТИ</span>
            <h2>Ближайшие мероприятия</h2>
            <p>Выбери следующее событие в своём кампусе</p>
          </div>

          <Link className="text-link" to="/events">
            Все мероприятия →
          </Link>
        </div>

        {loading && (
          <p role="status">
            Загружаем мероприятия...
          </p>
        )}

        {error && (
          <p role="alert">
            Не удалось загрузить мероприятия: {error}.
            Убедись, что backend запущен.
          </p>
        )}

        {!loading && !error && (
          events.length ? (
            <div className="events-grid">
              {events.slice(0, 6).map((event) => (
                <EventCard
                  key={event.id || event._id}
                  event={event}
                />
              ))}
            </div>
          ) : (
            <p>Пока мероприятий нет.</p>
          )
        )}
      </section>

      <section className="feature-strip">
        <div className="container feature-grid">
          <div>
            <strong>01 ✦</strong>
            <h3>Выбирай</h3>
            <p>Находи события по интересам</p>
          </div>

          <div>
            <strong>02 ✦</strong>
            <h3>Регистрируйся</h3>
            <p>Получай билет с QR-кодом</p>
          </div>

          <div>
            <strong>03 ✦</strong>
            <h3>Участвуй</h3>
            <p>Создавай незабываемые моменты</p>
          </div>
        </div>
      </section>
    </div>
  );
}
