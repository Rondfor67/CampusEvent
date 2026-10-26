
import { useCallback, useEffect, useState } from 'react';

const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const TIME_ZONE = 'Asia/Almaty';

function formatDate(date) {
  if (!date) return 'Не указана';

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Не указана';

  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

function formatTime(date) {
  if (!date) return 'Не указано';

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Не указано';

  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

function formatDateTime(date) {
  if (!date) return 'Не указана';

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Не указана';

  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

function venueName(venue) {
  if (!venue || typeof venue !== 'object') {
    return 'Не указано';
  }

  return (
    [venue.name, venue.building]
      .filter(Boolean)
      .join(', ') || 'Не указано'
  );
}

function Detail({ label, children }) {
  return (
    <div className="admin-detail">
      <span>{label}</span>
      <div>{children ?? 'Не указано'}</div>
    </div>
  );
}

function Admin() {
  const [activeTab, setActiveTab] = useState('events');

  const [events, setEvents] = useState([]);
  const [publishedEvents, setPublishedEvents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const request = useCallback(async (path, options = {}) => {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}${path.replace(/^\/api(?=\/|$)/, '')}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message ||
          data.error ||
          `Ошибка сервера: ${response.status}`
      );
    }

    return data;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (activeTab === 'events') {
        const data = await request(
          '/api/applications?status=pending'
        );

        setEvents(Array.isArray(data) ? data : []);
        const published = await request('/api/events');
        setPublishedEvents(
          Array.isArray(published) ? published : []
        );

      } else if (activeTab === 'messages') {
        const data = await request('/api/contacts');

        setMessages(
          Array.isArray(data) ? data : data.messages || []
        );
      } else if (activeTab === 'users') {
        const data = await request('/api/users');

        setUsers(
          Array.isArray(data) ? data : data.users || []
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, request]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function updateEvent(status) {
    if (!selectedEvent || submitting) return;

    if (status === 'rejected' && !rejectionReason.trim()) {
      setError('Укажи причину отклонения');
      return;
    }

    setError('');
    setNotice('');
    setSubmitting(true);

    try {
      await request(
        `/api/applications/${selectedEvent._id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status,
            rejectionReason:
              status === 'rejected'
                ? rejectionReason.trim()
                : '',
          }),
        }
      );

      setNotice(
        status === 'approved'
          ? selectedEvent.requestType === 'update' ? 'Изменения опубликованы.' : 'Заявка одобрена. Мероприятие опубликовано.'
          : 'Заявка отклонена.'
      );

      setSelectedEvent(null);
      setShowRejectForm(false);
      setRejectionReason('');

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }
  
  async function cancelPublishedEvent(event) {
    if (submitting) return;

    const confirmed = window.confirm(
      `Отменить мероприятие «${event.title}»?\n\n` +
      'Все билеты участников будут аннулированы.'
    );

    if (!confirmed) return;

    setSubmitting(true);
    setError('');
    setNotice('');

    try {
      await request(`/api/events/${event._id || event.id}/cancel`, {
        method: 'PATCH',
      });

      await loadData();
      setNotice(
        `Мероприятие «${event.title}» отменено. ` +
        'Билеты участников аннулированы.'
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function markMessage(message) {
    if (submitting) return;

    setError('');
    setNotice('');
    setSubmitting(true);

    try {
      await request(
        `/api/contacts/${message._id || message.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'resolved',
          }),
        }
      );

      setNotice('Сообщение отмечено как обработанное.');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function openEvent(event) {
    setSelectedEvent(event);
    setShowRejectForm(false);
    setRejectionReason('');
    setError('');
    setNotice('');
  }

  function backToList() {
    setSelectedEvent(null);
    setShowRejectForm(false);
    setRejectionReason('');
    setError('');
  }

  function changeTab(tab) {
    setActiveTab(tab);
    setSelectedEvent(null);
    setShowRejectForm(false);
    setRejectionReason('');
    setError('');
    setNotice('');
  }

  return (
    <section className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="admin-eyebrow">
            GO CAMPUS / УПРАВЛЕНИЕ
          </p>

          <h1>Панель администратора</h1>

          <p>
            Проверяй заявки, обращения и управляй
            мероприятиями.
          </p>
        </div>

        <button
          className="admin-refresh"
          onClick={loadData}
          disabled={loading || submitting}
        >
          {loading ? 'Загрузка...' : '↻ Обновить'}
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === 'events' ? 'active' : ''}
          onClick={() => changeTab('events')}
        >
          Мероприятия
        </button>

        <button
          className={activeTab === 'messages' ? 'active' : ''}
          onClick={() => changeTab('messages')}
        >
          Сообщения
        </button>

        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => changeTab('users')}
        >
          Пользователи
        </button>
      </div>

      {notice && (
        <p className="admin-notice" role="status">
          {notice}
        </p>
      )}

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="admin-empty">
          Загружаем данные...
        </div>
      ) : (
        <>
          {/* МЕРОПРИЯТИЯ */}
          {activeTab === 'events' && (
            <>
              {!selectedEvent ? (
                <>
                  <div className="admin-section-heading">
                    <h2>Заявки на рассмотрении</h2>
                    <span>{events.length} заявок</span>
                  </div>

                  {events.length === 0 ? (
                    <div className="admin-empty">
                      <h3>Заявок пока нет</h3>
                      <p>
                        Когда пользователи отправят
                        мероприятия на проверку,
                        они появятся здесь.
                      </p>
                    </div>
                  ) : (
                    <div className="admin-list">
                      {events.map((event) => (
                        <article
                          className="admin-item"
                          key={event._id}
                        >
                          <div className="admin-item-info">
                            <span className="admin-status">
                              {event.requestType === 'update' ? 'Обновить данные' : 'Создание мероприятия'}
                            </span>

                            <h3>{event.title}</h3>

                            <p>
                              {event.description ||
                                'Описание не указано.'}
                            </p>

                            <div className="admin-meta">
                              <span>
                                Дата:{' '}
                                {formatDate(event.startAt)}
                              </span>

                              <span>
                                Место:{' '}
                                {venueName(event.venue)}
                              </span>

                              <span>
                                Время:{' '}
                                {formatTime(event.startAt)}
                                {' — '}
                                {formatTime(event.endAt)}
                              </span>
                            </div>
                          </div>

                          <div className="admin-actions">
                            <button
                              className="admin-approve"
                              onClick={() => openEvent(event)}
                            >
                              Подробнее
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  <section className="admin-published-section">
                    <div className="admin-section-heading">
                      <h2>Опубликованные мероприятия</h2>
                      <span>{publishedEvents.length} мероприятий</span>
                    </div>

                    {publishedEvents.length === 0 ? (
                      <div className="admin-empty">
                        Опубликованных мероприятий пока нет.
                      </div>
                    ) : (
                      <div className="admin-list">
                        {publishedEvents.map((event) => (
                          <article
                            className="admin-item"
                            key={event._id || event.id}
                          >
                            <div className="admin-item-info">
                              <span className="admin-status">Опубликовано</span>
                              <h3>{event.title}</h3>
                              <p>{event.description}</p>
                              <div className="admin-meta">
                                <span>Дата: {formatDate(event.startAt)}</span>
                                <span>
                                  Участников: {event.registeredCount || 0}
                                </span>
                              </div>
                            </div>
                            <div className="admin-actions">
                              <button
                                type="button"
                                className="admin-reject"
                                disabled={submitting}
                                onClick={() => cancelPublishedEvent(event)}
                              >
                                Отменить одобрение
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              ) : (
                <div className="admin-request-details">
                  <button
                    className="admin-back"
                    onClick={backToList}
                    disabled={submitting}
                  >
                    ← Назад к заявкам
                  </button>

                  <div className="admin-detail-header">
                    <div>
                      <span className="admin-status">
                        Заявка на рассмотрении
                      </span>

                      <h2>{selectedEvent.title}</h2>
                      <p><strong>{selectedEvent.requestType === 'update' ? 'Обновить данные существующего мероприятия' : 'Создание мероприятия'}</strong></p>

                      <p>
                        Проверь все сведения перед
                        принятием решения.
                      </p>
                    </div>
                  </div>

                  <section className="admin-detail-section">
                    <h3>Основная информация</h3>

                    <div className="admin-detail-grid">
                      <Detail label="Название">
                        {selectedEvent.title}
                      </Detail>

                      <Detail label="Категория">
                        {selectedEvent.category}
                      </Detail>

                      <Detail label="Описание">
                        {selectedEvent.description}
                      </Detail>

                      <Detail label="Количество участников">
                        {selectedEvent.capacity}
                      </Detail>
                    </div>
                  </section>

                  {/* ФОТОГРАФИИ ИЗ ЗАЯВКИ */}
                  <section className="admin-detail-section">
                    <h3>Фотографии мероприятия</h3>

                    {Array.isArray(selectedEvent.images) &&
                    selectedEvent.images.length > 0 ? (
                      <div className="admin-event-photos">
                        {selectedEvent.images.map((image, index) => {
                          const src =
                            typeof image === 'string'
                              ? image
                              : image?.url || image?.secure_url;

                          if (!src) return null;

                          return (
                            <a
                              key={`${src}-${index}`}
                              href={src}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="admin-event-photo"
                              title="Открыть фотографию"
                            >
                              <img
                                src={src}
                                alt={`Фото мероприятия ${index + 1}`}
                                loading="lazy"
                              />
                              <span>
                                {index === 0
                                  ? 'Обложка'
                                  : `Фото ${index + 1}`}
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    ) : (
                      <p>Фотографии не добавлены.</p>
                    )}
                  </section>

                  <section className="admin-detail-section">
                    <h3>Дата и место проведения</h3>

                    <div className="admin-detail-grid">
                      <Detail label="Дата">
                        {formatDate(selectedEvent.startAt)}
                      </Detail>

                      <Detail label="Начало">
                        {formatTime(selectedEvent.startAt)}
                      </Detail>

                      <Detail label="Окончание">
                        {formatTime(selectedEvent.endAt)}
                      </Detail>

                      <Detail label="Место / аудитория">
                        {venueName(selectedEvent.venue)}
                      </Detail>
                    </div>


                  </section>

                  <section className="admin-detail-section">
                    <h3>Автор и контакты</h3>

                    <div className="admin-detail-grid">
                      <Detail label="Имя автора">
                        {selectedEvent.createdBy?.full_name ||
                          'Не указано'}
                      </Detail>

                      <Detail label="Email">
                        {selectedEvent.createdBy?.email ||
                          'Не указано'}
                      </Detail>

                      <Detail label="Телефон">
                        {selectedEvent.phone ||
                          'Не указано'}
                      </Detail>
                    </div>
                  </section>

                  <section className="admin-detail-section">
                    <h3>Организация мероприятия</h3>

                    <div className="admin-detail-grid">
                      <Detail label="Сообщение администрации">
                        {selectedEvent.comment ||
                          'Сообщение не добавлено'}
                      </Detail>
                    </div>
                  </section>

                  <section className="admin-decision">
                    <h3>Решение администратора</h3>

                    <p>
                      При отклонении укажи причину,
                      чтобы автор понимал,
                      что необходимо исправить.
                    </p>

                    {!showRejectForm ? (
                      <div className="admin-decision-buttons">
                        <button
                          className="admin-approve"
                          disabled={submitting}
                          onClick={() =>
                            updateEvent('approved')
                          }
                        >
                          {submitting
                            ? 'Обработка...'
                            : selectedEvent.requestType === 'update' ? 'Одобрить обновление' : 'Одобрить заявку'}
                        </button>

                        <button
                          className="admin-reject"
                          disabled={submitting}
                          onClick={() =>
                            setShowRejectForm(true)
                          }
                        >
                          Отклонить заявку
                        </button>
                      </div>
                    ) : (
                      <div className="admin-rejection-form">
                        <label htmlFor="rejection-reason">
                          Причина отклонения
                        </label>

                        <textarea
                          id="rejection-reason"
                          value={rejectionReason}
                          onChange={(e) =>
                            setRejectionReason(e.target.value)
                          }
                          placeholder="Например, помещение занято в выбранное время..."
                          rows={4}
                          disabled={submitting}
                        />

                        <div className="admin-decision-buttons">
                          <button
                            className="admin-reject"
                            disabled={
                              !rejectionReason.trim() ||
                              submitting
                            }
                            onClick={() =>
                              updateEvent('rejected')
                            }
                          >
                            {submitting
                              ? 'Обработка...'
                              : 'Подтвердить отклонение'}
                          </button>

                          <button
                            className="admin-back"
                            disabled={submitting}
                            onClick={() => {
                              setShowRejectForm(false);
                              setRejectionReason('');
                            }}
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              )}
            </>
          )}

          {/* СООБЩЕНИЯ */}
          {activeTab === 'messages' && (
            <>
              <div className="admin-section-heading">
                <h2>Обратная связь</h2>
                <span>{messages.length} сообщений</span>
              </div>

              {messages.length === 0 ? (
                <div className="admin-empty">
                  <h3>Сообщений пока нет</h3>
                  <p>
                    Когда студенты отправят обращения
                    через страницу «Контакты»,
                    они появятся здесь.
                  </p>
                </div>
              ) : (
                <div className="admin-list">
                  {messages.map((message) => (
                    <article
                      className="admin-item"
                      key={message._id || message.id}
                    >
                      <div className="admin-item-info">
                        <span className="admin-status">
                          {message.status === 'resolved'
                            ? 'Обработано'
                            : message.status === 'read'
                              ? 'Прочитано'
                              : 'Новое сообщение'}
                        </span>

                        <h3>
                          {message.subject || 'Без темы'}
                        </h3>

                        <p>
                          {message.message ||
                            'Текст сообщения отсутствует'}
                        </p>

                        <div className="admin-meta">
                          <span>
                            Отправитель:{' '}
                            {message.full_name ||
                              'Не указано'}
                          </span>

                          <span>
                            Email: {message.email}
                          </span>
                          
                          <span>
                            Телефон:{' '}
                            {message.user?.phone ? (
                              <a href={`tel:${message.user.phone}`}>
                                {message.user.phone}
                              </a>
                            ) : (
                              'Не указан'
                            )}
                          </span>


                          <span>
                            Дата:{' '}
                            {formatDateTime(
                              message.createdAt
                            )}
                          </span>
                        </div>
                      </div>

                      {message.status !== 'resolved' && (
                        <div className="admin-actions">
                          <button
                            className="admin-approve"
                            disabled={submitting}
                            onClick={() =>
                              markMessage(message)
                            }
                          >
                            {submitting
                              ? 'Обработка...'
                              : 'Отметить обработанным'}
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ПОЛЬЗОВАТЕЛИ */}
          {activeTab === 'users' && (
            <>
              <div className="admin-section-heading">
                <h2>Пользователи</h2>
                <span>{users.length} пользователей</span>
              </div>

              {users.length === 0 ? (
                <div className="admin-empty">
                  <h3>Пользователей пока нет</h3>
                </div>
              ) : (
                <div className="admin-users-table">
                  <div className="admin-user-row admin-user-header">
                    <span>Пользователь</span>
                    <span>Email</span>
                    <span>Роль</span>
                  </div>

                  {users.map((user) => (
                    <div
                      className="admin-user-row"
                      key={user._id || user.id}
                    >
                      <span>
                        {user.full_name ||
                          user.name ||
                          [
                            user.firstName ||
                              user.first_name,
                            user.lastName ||
                              user.last_name,
                          ]
                            .filter(Boolean)
                            .join(' ') ||
                          'Не указано'}
                      </span>

                      <span>{user.email}</span>

                      <span>
                        {user.role === 'admin'
                          ? 'Администратор'
                          : 'Пользователь'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}

export default Admin;
