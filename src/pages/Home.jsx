
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEvents } from "../services/api";

function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await getEvents();
        setEvents(data);
      } catch (err) {
        setError(
          "Не удалось загрузить мероприятия. Проверь, запущен ли сервер."
        );
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  return (
    <main className="home-page">
      <section className="hero">
        <div className="hero-content">
          <span className="hero-label">CAMPUS LIFE</span>

          <h1>
            Твоя студенческая жизнь
            <br />
            начинается здесь
          </h1>

          <p>
            Находи интересные мероприятия, посещай мастер-классы,
            знакомься с людьми и создавай воспоминания вместе с CampusEvents.
          </p>

          <Link to="/events" className="hero-button">
            Найти мероприятие
          </Link>
        </div>
      </section>

      <section className="events-section">
        <div className="section-heading">
          <div>
            <span className="section-label">НЕ ПРОПУСТИ</span>
            <h2>Ближайшие мероприятия</h2>
            <p>Выбирай, куда отправиться в следующий раз</p>
          </div>

          <Link to="/events" className="all-events-link">
            Все мероприятия →
          </Link>
        </div>

        {loading && (
          <p className="status-message">Загружаем мероприятия...</p>
        )}

        {!loading && error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>
              Попробовать снова
            </button>
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <p className="status-message">
            Пока мероприятий нет. Загляни сюда позже!
          </p>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="events-grid">
            {events.slice(0, 3).map((event) => {
              const freeSeats = Math.max(
                0,
                Number(event.capacity) -
                  Number(event.registeredCount)
              );

              const formattedDate = event.date
                ? new Intl.DateTimeFormat("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(new Date(event.date))
                : "Дата уточняется";

              return (
                <article className="event-card" key={event.id}>
                  <div className="event-card-top">
                    <span className="event-category">
                      {event.category || "Мероприятие"}
                    </span>
                    <span className="event-icon">✦</span>
                  </div>

                  <div className="event-card-body">
                    <p className="event-date">📅 {formattedDate}</p>

                    <h3>{event.title}</h3>

                    <p className="event-description">
                      {event.description || "Подробнее о мероприятии"}
                    </p>

                    <p className="event-location">
                      📍 {event.location || "Место уточняется"}
                    </p>

                    <div className="event-card-bottom">
                      <span
                        className={
                          freeSeats > 0
                            ? "seats-available"
                            : "seats-full"
                        }
                      >
                        {freeSeats > 0
                          ? `Свободно мест: ${freeSeats}`
                          : "Мест нет"}
                      </span>

                      <Link
                        to={`/events/${event.id}`}
                        className="event-details-link"
                      >
                        Подробнее →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default Home;
