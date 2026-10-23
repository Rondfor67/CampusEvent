
import { Link } from 'react-router-dom';

export default function EventCard({ event }) {
  const seats = Math.max(
    0,
    Number(event.capacity) - Number(event.registeredCount)
  );

  const date = new Date(event.date);
  const validDate = !Number.isNaN(date.getTime());

  // Первая фотография мероприятия — обложка
  const coverImage =
    Array.isArray(event.images) && event.images.length > 0
      ? event.images[0]
      : null;

  return (
    <article className="event-card">
      <div className="event-image">
        {coverImage ? (
          <img
            src={coverImage}
            alt={event.title}
            className="event-cover"
            loading="lazy"
          />
        ) : (
          <div className="event-art">✦</div>
        )}

        <span className="category-pill">
          {event.category || 'Мероприятие'}
        </span>
      </div>

      <div className="event-body">
        <div className="date-badge">
          <strong>
            {validDate ? date.getDate() : '—'}
          </strong>

          <span>
            {validDate
              ? date.toLocaleDateString('ru-RU', {
                  month: 'short',
                })
              : 'Дата'}
          </span>
        </div>

        <div className="event-info">
          <h3>{event.title}</h3>

          <p>
            📍 {event.location || 'Место уточняется'}
          </p>

          <p className="status">
            {seats > 0
              ? `Осталось мест: ${seats}`
              : 'Мест нет'}
          </p>

          <Link
            to={`/events/${event.id}`}
            className="text-link"
          >
            Подробнее →
          </Link>
        </div>
      </div>
    </article>
  );
}
