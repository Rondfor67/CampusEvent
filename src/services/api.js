
// Единая точка обращения к серверу.
// В dev Vite проксирует /api на Express.

const API_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || `Ошибка API (${response.status})`
    );
  }

  return data;
}

// Приведение данных мероприятия к единому формату
function normalizeEvent(event) {
  const capacity = Number(event.capacity ?? 0);
  const registeredCount = Number(event.registeredCount ?? 0);

  return {
    ...event,

    // Общее количество мест
    capacity,

    // Количество зарегистрированных участников
    registeredCount,

    // Оставшиеся свободные места
    availableSeats: Math.max(
      0,
      capacity - registeredCount
    ),
  };
}

// Получить все мероприятия
export async function getEvents() {
  const events = await request('/events');

  return events.map(normalizeEvent);
}

// Получить одно мероприятие
export async function getEvent(id) {
  const event = await request(
    `/events/${encodeURIComponent(id)}`
  );

  return normalizeEvent(event);
}

// Записаться на мероприятие
export function registerForEvent({
  eventId,
  studentName,
  email,
}) {
  return request('/registrations', {
    method: 'POST',
    body: JSON.stringify({
      eventId,
      studentName,
      email,
    }),
  });
}

// Получить регистрации
export function getRegistrations() {
  const token = localStorage.getItem('token');

  return request('/registrations/my', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
// Создать мероприятие
export function createEvent(event) {
  return request('/events', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

// Удалить мероприятие
export function deleteEvent(id) {
  return request(
    `/events/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    }
  );
}
