
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getEvent } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function getUser() {
  try {
    if (!localStorage.getItem('token')) return null;
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

function formatDate(value) {
  if (!value) return 'Уточняется';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Уточняется';

  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Asia/Almaty',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function EventDetails() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [user, setUser] = useState(getUser);

  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState('');

  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Галерея фотографий
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const isAdmin = user?.role === 'admin';
  const isParticipant = ['user', 'teacher'].includes(user?.role);

  useEffect(() => {
    function updateAuth() {
      setUser(getUser());
    }

    window.addEventListener('authChanged', updateAuth);
    window.addEventListener('auth-change', updateAuth);
    window.addEventListener('storage', updateAuth);

    return () => {
      window.removeEventListener('authChanged', updateAuth);
      window.removeEventListener('auth-change', updateAuth);
      window.removeEventListener('storage', updateAuth);
    };
  }, []);

  // Закрытие фотографии клавишей Escape
  useEffect(() => {
    if (selectedPhoto === null) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setSelectedPhoto(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPhoto]);

  // При переходе на другое мероприятие закрываем галерею
  useEffect(() => {
    setSelectedPhoto(null);
  }, [id]);

  // Загрузка мероприятия
  useEffect(() => {
    let cancelled = false;

    async function loadEvent() {
      setLoading(true);
      setError('');

      try {
        const found = await getEvent(id);

        if (!cancelled) {
          setEvent(found);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || 'Не удалось загрузить мероприятие'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadEvent();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Загрузка участников для администратора
  useEffect(() => {
    if (!isAdmin || !event) {
      setParticipants([]);
      return;
    }

    const controller = new AbortController();

    async function loadParticipants() {
      setParticipantsLoading(true);
      setParticipantsError('');

      try {
        const token = localStorage.getItem('token');

        const response = await fetch(
          `${API_URL}/registrations/event/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message || 'Не удалось загрузить участников'
          );
        }

        if (!controller.signal.aborted) {
          setParticipants(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setParticipantsError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setParticipantsLoading(false);
        }
      }
    }

    loadParticipants();

    return () => controller.abort();
  }, [id, isAdmin, event?._id]);

  // Проверка существующей записи
  useEffect(() => {
    if (!isParticipant || !event) {
      setAlreadyRegistered(false);
      return;
    }

    const controller = new AbortController();

    async function checkRegistration() {
      try {
        const token = localStorage.getItem('token');

        const response = await fetch(
          `${API_URL}/registrations/my`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) return;

        const registrations = await response.json();

        if (
          !controller.signal.aborted &&
          Array.isArray(registrations)
        ) {
          setAlreadyRegistered(
            registrations.some(
              (registration) =>
                String(
                  registration.event?._id ||
                  registration.event
                ) === String(id)
            )
          );
        }
      } catch {
        // Сервер также проверяет повторную регистрацию.
      }
    }

    checkRegistration();

    return () => controller.abort();
  }, [id, isParticipant, event?._id]);

  // Запись на мероприятие
  async function handleRegistration() {
    if (!isParticipant || !event || submitting) return;

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: event._id || event.id,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || 'Не удалось записаться на мероприятие'
        );
      }

      setAlreadyRegistered(true);

      setSuccess(
        'Ты успешно записана! Билет сохранён в разделе «Мои билеты».'
      );

      const updatedEvent = await getEvent(id);
      setEvent(updatedEvent);
    } catch (err) {
      setError(
        err.message || 'Не удалось связаться с сервером'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="event-details-page">
        <p>Загружаем мероприятие...</p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="event-details-page">
        <h1>{error || 'Мероприятие не найдено'}</h1>

        <Link to="/events">
          Вернуться к мероприятиям
        </Link>
      </main>
    );
  }

  // Подсчёт свободных мест
  const registeredCount = Number(event.registeredCount) || 0;

  const totalCapacity =
    Number(event.availableSeats ?? event.capacity ?? 0) +
    registeredCount;

  const availableSeats = Math.max(
    0,
    totalCapacity - registeredCount
  );

  const occupancyPercent = totalCapacity > 0
    ? Math.min(100, (registeredCount / totalCapacity) * 100)
    : 0;

  const eventStarted = event.startAt
    ? new Date(event.startAt) <= new Date()
    : false;

  // Фотографии, полученные из Cloudinary
  const images = Array.isArray(event.images)
    ? event.images.filter(
        (url) => typeof url === 'string' && url.trim()
      )
    : [];

  return (
    <main className="event-details-page">
      <Link to="/events" className="back-link">
        ← Все мероприятия
      </Link>

      <div className="event-details-card">
        <span className="event-category">
          {event.category || 'Мероприятие'}
        </span>

        <h1>{event.title}</h1>

        {/* =====================================
            ГАЛЕРЕЯ ФОТОГРАФИЙ
            ===================================== */}

        {images.length > 0 && (
          <section className="event-gallery">
            <button
              type="button"
              className="event-gallery-cover"
              onClick={() => setSelectedPhoto(0)}
              aria-label="Открыть главное фото"
            >
              <img
                src={images[0]}
                alt={`${event.title} — главное фото`}
              />
            </button>

            {images.length > 1 && (
              <div className="event-gallery-grid">
                {images.slice(1).map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className="event-gallery-thumbnail"
                    onClick={() => setSelectedPhoto(index + 1)}
                    aria-label={`Открыть фото ${index + 2}`}
                  >
                    <img
                      src={image}
                      alt={`${event.title} — фото ${index + 2}`}
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        <p>
          {event.description || 'Описание пока не добавлено.'}
        </p>

        <p>
          📅 Дата: {formatDate(event.startAt || event.date)}
        </p>

        <p>
          📍 Место: {event.location || 'Уточняется'}
        </p>

        <p>
          🎟 Свободно мест: {availableSeats} из {totalCapacity}
        </p>

        <p>
          Зарегистрировано участников: {registeredCount}
        </p>

        <div
          style={{
            width: '100%',
            maxWidth: 550,
            height: 10,
            background: '#e9dfce',
            borderRadius: 10,
            overflow: 'hidden',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: `${occupancyPercent}%`,
              height: '100%',
              background: '#c03923',
              borderRadius: 10,
            }}
          />
        </div>

        {/* =====================================
            АДМИНИСТРАТОР: УЧАСТНИКИ
            ===================================== */}

        {isAdmin ? (
          <section>
            <h2>Зарегистрированные участники</h2>

            {participantsLoading ? (
              <p>Загружаем участников...</p>
            ) : participantsError ? (
              <p role="alert">{participantsError}</p>
            ) : participants.length === 0 ? (
              <p>На мероприятие пока никто не записался.</p>
            ) : (
              <div className="admin-users-table">
                <div className="admin-user-row admin-user-header">
                  <span>Участник</span>
                  <span>Email</span>
                  <span>Дата записи</span>
                </div>

                {participants.map((participant) => (
                  <div
                    className="admin-user-row"
                    key={participant.id}
                  >
                    <span>{participant.full_name}</span>
                    <span>{participant.email}</span>
                    <span>
                      {formatDate(participant.registeredAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : !user ? (
          <section>
            <h2>Записаться на мероприятие</h2>

            <p>
              Для записи необходимо войти в аккаунт
              студента или преподавателя.
            </p>

            <Link
              to="/login"
              state={{ from: `/events/${id}` }}
              className="btn btn-primary"
            >
              Войти, чтобы записаться
            </Link>
          </section>
        ) : !isParticipant ? (
          <section>
            <h2>Записаться на мероприятие</h2>

            <p>
              Запись доступна только студентам и преподавателям.
            </p>
          </section>
        ) : (
          <section>
            <h2>Записаться на мероприятие</h2>

            {alreadyRegistered ? (
              <>
                <p role="status">
                  ✓ Ты уже записана на это мероприятие.
                </p>

                <Link
                  to="/tickets"
                  className="btn btn-primary"
                >
                  Перейти к моим билетам
                </Link>
              </>
            ) : eventStarted ? (
              <p>Регистрация на мероприятие закрыта.</p>
            ) : availableSeats === 0 ? (
              <p>Свободных мест больше нет.</p>
            ) : (
              <>
                <p>
                  Запись будет оформлена на аккаунт:
                  <strong> {user.full_name}</strong>
                </p>

                <p>{user.email}</p>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleRegistration}
                >
                  {submitting ? 'Записываем...' : 'Записаться'}
                </button>
              </>
            )}
          </section>
        )}

        {error && (
          <p role="alert">{error}</p>
        )}

        {success && (
          <p role="status">{success}</p>
        )}
      </div>

      {/* =====================================
          УВЕЛИЧЕННЫЙ ПРОСМОТР ФОТО
          ===================================== */}

      {selectedPhoto !== null && images[selectedPhoto] && (
        <div
          className="event-photo-lightbox"
          role="presentation"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="event-photo-lightbox-content"
            role="dialog"
            aria-modal="true"
            aria-label="Просмотр фотографии мероприятия"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="event-photo-lightbox-close"
              onClick={() => setSelectedPhoto(null)}
              aria-label="Закрыть фотографию"
            >
              ×
            </button>

            <img
              src={images[selectedPhoto]}
              alt={`${event.title} — фото ${selectedPhoto + 1}`}
            />

            <div className="event-photo-lightbox-controls">
              <button
                type="button"
                onClick={() =>
                  setSelectedPhoto(
                    (selectedPhoto - 1 + images.length) %
                      images.length
                  )
                }
                disabled={images.length < 2}
                aria-label="Предыдущее фото"
              >
                ←
              </button>

              <span>
                {selectedPhoto + 1} / {images.length}
              </span>

              <button
                type="button"
                onClick={() =>
                  setSelectedPhoto(
                    (selectedPhoto + 1) % images.length
                  )
                }
                disabled={images.length < 2}
                aria-label="Следующее фото"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default EventDetails;
