
import { useMemo, useState } from 'react';
import events from '../data/events';
import EventCard from '../components/EventCard';

function Events() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const categories = useMemo(
    () => [...new Set(events.map((event) => event.category))],
    []
  );

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    const matchesCategory =
      category === 'all' || event.category === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <section>
      <h1>Мероприятия</h1>

      <label htmlFor="event-search">Поиск по названию</label>
      <input
        id="event-search"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Например, мастер-класс"
      />

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
    </section>
  );
}

export default Events;
