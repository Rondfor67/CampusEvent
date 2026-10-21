
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getEvents } from "../services/api";

const API_URL = "http://localhost:3000/api";

function EventDetails() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadEvent() {
      try {
        const events = await getEvents();
        const found = events.find((item) => item.id === Number(id));

        if (!found) {
          setError("Мероприятие не найдено.");
        } else {
          setEvent(found);
        }
      } catch {
        setError("Не удалось загрузить мероприятие.");
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [id]);

  async function handleRegistration(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/registrations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: Number(id),
          studentName,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Не удалось записаться.");
      }

      setSuccess(
        "Ты успешно записалась! Теперь открой раздел «Мои билеты», чтобы увидеть свой QR-код."
      );
      setStudentName("");
      setEmail("");
    } catch (err) {
      setError(err.message || "Не удалось связаться с сервером.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <main><p>Загружаем мероприятие...</p></main>;

  if (!event) {
    return (
      <main className="event-details-page">
        <h1>{error || "Мероприятие не найдено."}</h1>
        <Link to="/events">Вернуться к мероприятиям</Link>
      </main>
    );
  }

  return (
    <main className="event-details-page">
      <Link to="/events" className="back-link">
        ← Все мероприятия
      </Link>

      <div className="event-details-card">
        <span className="event-category">
          {event.category || "Мероприятие"}
        </span>

        <h1>{event.title}</h1>
        <p>{event.description || "Описание пока не добавлено."}</p>
        <p>📅 Дата: {event.date || "Уточняется"}</p>
        <p>📍 Место: {event.location || "Уточняется"}</p>
        <p>🎟 Свободных мест: {event.capacity}</p>

        <h2>Записаться на мероприятие</h2>

        <form onSubmit={handleRegistration}>
          <label htmlFor="student-name">Имя и фамилия</label>
          <input
            id="student-name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            required
            placeholder="Например, Алия Садыкова"
          />

          <label htmlFor="student-email">Email</label>
          <input
            id="student-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="student@example.com"
          />

          <button type="submit" disabled={submitting}>
            {submitting ? "Записываем..." : "Записаться"}
          </button>
        </form>

        {error && <p role="alert">{error}</p>}
        {success && <p role="status">{success}</p>}
      </div>
    </main>
  );
}

export default EventDetails;
