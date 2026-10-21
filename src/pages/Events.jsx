
import { useEffect, useMemo, useState } from "react";
import { getEvents } from "../services/api";
import EventCard from "../components/EventCard";

function Events() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await getEvents();
        setEvents(data);
      } catch (err) {
        setError("Не удалось загрузить мероприятия. Проверь, запущен ли сервер.");
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  const categories = useMemo(
    () => [...new Set(events.map((event) => event.category).filter(Boolean))],
    [events]
  );

  const filteredEvents = events.filter((event) => {
    const matchesSearch = (event.title || "")
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    const matchesCategory =
      category === "all" || event.category === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <main className="events-page">
      <h1>Мероприятия</h1>
      <p>Найди интересное событие в жизни кампуса.</p>

      <div className="events-filters">
        <div>
          <label htmlFor="event-search">Поиск по названию</label>
          <input
            id="event-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Например, хакатон"
          />
        </div>

        <div>
          <label htmlFor="event-category">Категория</label>
          <select
            id="event-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">Все категории</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p>Загружаем мероприятия...</p>}

      {!loading && error && (
        <p role="alert">{error}</p>
      )}

      {!loading && !error && (
        <>
          <p>Найдено мероприятий: {filteredEvents.length}</p>

          <div className="events-grid">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <p>Мероприятия не найдены.</p>
            )}
          </div>
        </>
      )}
    </main>
  );
}

export default Events;
