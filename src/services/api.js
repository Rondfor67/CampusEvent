// Единая точка обращения к серверу. В dev Vite проксирует /api на Express.
const API_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || `Ошибка API (${response.status})`);
  return data;
}

function normalizeEvent(event) {
  return { ...event, capacity: event.availableSeats ?? event.capacity ?? 0,
    registeredCount: event.registeredCount ?? 0 };
}
export async function getEvents() {
  return (await request('/events')).map(normalizeEvent);
}
export async function getEvent(id) {
  return normalizeEvent(await request(`/events/${encodeURIComponent(id)}`));
}
export function registerForEvent({ eventId, studentName, email }) {
  return request('/registrations', { method: 'POST', body: JSON.stringify({ eventId, studentName, email }) });
}
export function getRegistrations() { return request('/registrations'); }
export function createEvent(event) { return request('/events', { method: 'POST', body: JSON.stringify(event) }); }
export function deleteEvent(id) { return request(`/events/${encodeURIComponent(id)}`, { method: 'DELETE' }); }
