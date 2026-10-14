
import { Link } from 'react-router-dom';

function EventCard({ event }) {
  const freeSeats = Math.max(
    0,
    event.capacity - event.registeredCount
  );

  const formattedDate = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(event.date));

  return (
    <article className="event-card">
      <p>{event.category}</p>

      <h2>{event.title}</h2>

      <p>{formattedDate}</p>
      <p>{event.location}</p>
      <p>Свободных мест: {freeSeats}</p>

      <Link to={`/events/${event.id}`}>
        Подробнее
      </Link>
    </article>
  );
}

export default EventCard;
