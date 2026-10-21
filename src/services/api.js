
const API_URL = "http://localhost:3000/api";

export async function getEvents() {
  const response = await fetch(`${API_URL}/events`);

  if (!response.ok) {
    throw new Error("Не удалось загрузить мероприятия");
  }

  const data = await response.json();

  // Приводим данные бэкенда к формату карточек фронтенда
  return data.map((event) => ({
    ...event,
    capacity: event.availableSeats ?? event.capacity ?? 0,
    registeredCount: event.registeredCount ?? 0,
  }));
}
