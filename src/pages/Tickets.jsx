
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import TicketCard from '../components/TicketCard';
import { getRegistrations } from '../services/api';

function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadTickets() {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error(
            'Войди в аккаунт, чтобы посмотреть свои билеты.'
          );
        }

        const registrations = await getRegistrations();

        const result = registrations.map((registration) => {
          const event = registration.event;

          return {
            ...registration,

            // Поля для совместимости с TicketCard
            id: registration._id,
            eventId: event?._id ?? null,
            eventTitle:
              event?.title || 'Мероприятие недоступно',

            // Данные мероприятия
            title: event?.title || 'Мероприятие недоступно',
            date: event?.startAt ?? null,
            location: event?.venue?.name || 'Место не указано',

            // Настоящий код билета из MongoDB
            ticketCode: registration.ticketCode,
            code: registration.ticketCode,

            status: registration.status,
          };
        });

        if (!cancelled) {
          setTickets(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              'Не удалось загрузить билеты.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTickets();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="tickets-page">
      <h1>Мои билеты</h1>

      <p>
        Здесь отображаются билеты на мероприятия,
        на которые ты записалась.
      </p>

      {loading && <p>Загружаем билеты...</p>}

      {error && (
        <div>
          <p role="alert">{error}</p>

          {!localStorage.getItem('token') && (
            <Link to="/login" className="text-link">
              Войти в аккаунт →
            </Link>
          )}
        </div>
      )}

      {!loading && !error && tickets.length === 0 && (
        <div>
          <p>
            У тебя пока нет билетов.
            Запишись на интересное мероприятие!
          </p>

          <Link to="/events" className="text-link">
            Посмотреть мероприятия →
          </Link>
        </div>
      )}

      {!loading && !error && tickets.length > 0 && (
        <div className="tickets-list">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
            />
          ))}
        </div>
      )}
    </main>
  );
}

export default Tickets;
