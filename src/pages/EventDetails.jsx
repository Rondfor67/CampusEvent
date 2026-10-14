
import { Link, useParams } from 'react-router-dom';
import events from '../data/events';

function EventDetails() {
  const { id } = useParams();

  const event = events.find((item) => item.id === Number(id));

  if (!event) {
    return (
      <section>
        <h1>Мероприятие не найдено</h1>
        <Link to="/events">Вернуться к каталогу</Link>
      </section>
    );
  }

  const freeSeats = Math.max(
    0,
    event.capacity - event.registeredCount
  );

  return (
    <article>
      <Link to="/events">← К мероприятиям</Link>

      <h1>{event.title}</h1>
      <p>Категория: {event.category}</p>
      <p>{event.description}</p>
      <p>Место: {event.location}</p>
      <p>
        Дата: {new Intl.DateTimeFormat('ru-RU', {
          dateStyle: 'long',
          timeStyle: 'short',
        }).format(new Date(event.date))}
      </p>
      <p>Свободных мест: {freeSeats}</p>
    </article>
  );
}

export default EventDetails;
