
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

function TicketDetails() {
  const { code } = useParams();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadTicket() {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error(
            'Войди под администратором, чтобы проверить билет.'
          );
        }

        const response = await fetch(
          `/api/registrations/ticket/${encodeURIComponent(code)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || 'Не удалось проверить билет'
          );
        }

        if (!cancelled) {
          setTicket(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTicket();

    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <main className="tickets-page">
      <h1>Проверка электронного билета</h1>

      {loading && <p>Проверяем билет в базе данных...</p>}

      {error && (
        <div>
          <p role="alert">{error}</p>
          <Link to="/login" className="text-link">
            Войти →
          </Link>
        </div>
      )}

      {!loading && ticket && (
        <article className="ticket-card">
          <div className="ticket-card-info">
            <span className="event-category">
              CAMPUS EVENTS / QR-БИЛЕТ
            </span>

            <h2>{ticket.eventTitle}</h2>

            <p>
              <strong>Участник:</strong> {ticket.studentName}
            </p>

            <p>
              <strong>Email:</strong> {ticket.email}
            </p>

            <p>
              <strong>Место:</strong> {ticket.location}
            </p>

            <p>
              <strong>Дата мероприятия:</strong>{' '}
              {ticket.eventDate
                ? new Date(ticket.eventDate).toLocaleString('ru-RU')
                : 'Не указана'}
            </p>

            <p>
              <strong>Дата регистрации:</strong>{' '}
              {new Date(ticket.registeredAt).toLocaleString('ru-RU')}
            </p>

            <p>
              <strong>Статус:</strong>{' '}
              {ticket.valid
                ? '✅ Билет действителен'
                : '❌ Билет недействителен'}
            </p>

            <p>
              <strong>Код билета:</strong>{' '}
              <code>{ticket.ticketCode}</code>
            </p>
          </div>
        </article>
      )}
    </main>
  );
}

export default TicketDetails;
