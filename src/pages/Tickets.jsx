
import { useEffect, useState } from "react";
import TicketCard from "../components/TicketCard";

const API_URL = "http://localhost:3000/api";

function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTickets() {
      try {
        const response = await fetch(`${API_URL}/registrations`);

        if (!response.ok) {
          throw new Error("Не удалось загрузить билеты");
        }

        const registrations = await response.json();

        const result = await Promise.all(
          registrations.map(async (ticket) => {
            try {
              const eventResponse = await fetch(
                `${API_URL}/events/${ticket.eventId}`
              );

              if (!eventResponse.ok) {
                return {
                  ...ticket,
                  eventTitle: `Мероприятие №${ticket.eventId}`,
                };
              }

              const event = await eventResponse.json();

              return {
                ...ticket,
                eventTitle: event.title,
              };
            } catch {
              return {
                ...ticket,
                eventTitle: `Мероприятие №${ticket.eventId}`,
              };
            }
          })
        );

        setTickets(result);
      } catch {
        setError(
          "Не удалось загрузить билеты. Проверь, запущен ли сервер."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, []);

  return (
    <main className="tickets-page">
      <h1>Мои билеты</h1>
      <p>Здесь отображаются билеты на мероприятия, на которые ты записалась.</p>

      {loading && <p>Загружаем билеты...</p>}

      {error && <p role="alert">{error}</p>}

      {!loading && !error && tickets.length === 0 && (
        <p>У тебя пока нет билетов. Запишись на интересное мероприятие!</p>
      )}

      {!loading && !error && tickets.length > 0 && (
        <div className="tickets-list">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </main>
  );
}

export default Tickets;
