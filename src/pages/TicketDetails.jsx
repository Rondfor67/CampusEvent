
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getRegistrations, getEvent } from "../services/api";

function TicketDetails() {
  const { code } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTicket() {
      try {
        const registrations = await getRegistrations();
        const found = registrations.find(
          (item) => item.ticketCode === code
        );

        if (!found) {
          setError("Билет не найден или недействителен.");
          return;
        }

        const event = await getEvent(found.eventId).catch(() => null);

        setTicket({
          ...found,
          eventTitle: event?.title || `Мероприятие №${found.eventId}`,
        });
      } catch (err) {
        setError(err.message || "Ошибка проверки билета.");
      } finally {
        setLoading(false);
      }
    }

    loadTicket();
  }, [code]);

  if (loading) return <main><p>Проверяем билет...</p></main>;

  if (error) {
    return (
      <main className="tickets-page">
        <h1>Билет не подтверждён</h1>
        <p>{error}</p>
        <Link to="/">На главную</Link>
      </main>
    );
  }

  return (
    <main className="tickets-page">
      <h1>Информация о билете</h1>
      <p><strong>Участник:</strong> {ticket.studentName}</p>
      <p><strong>Email:</strong> {ticket.email}</p>
      <p><strong>Мероприятие:</strong> {ticket.eventTitle}</p>
      <p>
        <strong>Дата регистрации:</strong>{" "}
        {new Date(ticket.createdAt).toLocaleString("ru-RU")}
      </p>
      <p>
        <strong>Статус:</strong>{" "}
        {ticket.checkedIn ? "Посещение подтверждено" : "Билет действителен"}
      </p>
    </main>
  );
}

export default TicketDetails;
