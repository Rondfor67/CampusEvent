
import { useCallback, useEffect, useState } from 'react';

function Admin() {
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const token = localStorage.getItem('token');

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message || data.error || `Ошибка сервера: ${response.status}`
      );
    }

    return data;
  }, [token]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (activeTab === 'events') {
        const data = await request('/api/events?status=pending');
        setEvents(Array.isArray(data) ? data : data.events || []);
      } else if (activeTab === 'messages') {
        const data = await request('/api/contacts');
        setMessages(Array.isArray(data) ? data : data.messages || []);
      } else if (activeTab === 'users') {
        const data = await request('/api/users');
        setUsers(Array.isArray(data) ? data : data.users || []);
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
    if (!selectedEvent) return;

    setError('');
    setNotice('');

    try {
      await request(`/api/events/${selectedEvent.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          rejectionReason: status === 'rejected' ? rejectionReason.trim() : '',
        }),
      });

      setNotice(
        status === 'approved'
          ? 'Мероприятие одобрено.'
          : 'Заявка отклонена.'
      );

      setSelectedEvent(null);
      setShowRejectForm(false);
      setRejectionReason('');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function markMessage(message) {
    setError('');
    setNotice('');

    try {
      await request(`/api/contacts/${message.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'processed' }),
      });

      setNotice('Сообщение отмечено как обработанное.');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function value(...values) {
    return values.find(
      (item) => item !== undefined && item !== null && item !== ''
    ) || '';
  }

  function Detail({ label, children }) {
    return (
      <div className="admin-detail">
        <span>{label}</span>
        <div>{children || 'Не указано'}</div>
      </div>
    );
  }

  return (
    <section className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="admin-eyebrow">GO CAMPUS / УПРАВЛЕНИЕ</p>
          <h1>Панель администратора</h1>
          <p>Проверяй заявки и управляй мероприятиями.</p>
        </div>

        <button
          className="admin-refresh"
          onClick={loadData}
          disabled={loading}
        >
          {loading ? 'Загрузка...' : '↻ Обновить'}
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === 'events' ? 'active' : ''}
          onClick={() => {
            setActiveTab('events');
            setSelectedEvent(null);
          }}
        >
          Мероприятия
        </button>

        <button
          className={activeTab === 'messages' ? 'active' : ''}
          onClick={() => {
            setActiveTab('messages');
            setSelectedEvent(null);
          }}
        >
          Сообщения
        </button>

        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => {
            setActiveTab('users');
            setSelectedEvent(null);
          }}
        >
          Пользователи
        </button>
      </div>

      {notice && <p className="admin-notice" role="status">{notice}</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}

      {loading ? (
        <div className="admin-empty">Загружаем данные...</div>
      ) : (
        <>
          {activeTab === 'events' && (
            <>
              {!selectedEvent ? (
                <>
                  <div className="admin-section-heading">
                    <h2>Заявки на публикацию</h2>
                    <span>{events.length} заявок</span>
                  </div>

                  {events.length === 0 ? (
                    <div className="admin-empty">
                      <h3>Заявок пока нет</h3>
                      <p>
                        Когда пользователи отправят мероприятия на проверку,
                        они появятся здесь.
                      </p>
                    </div>
                  ) : (
                    <div className="admin-list">
                      {events.map((event) => (
                        <article className="admin-item" key={event.id}>
                          <div className="admin-item-info">
                            <span className="admin-status">
                              Ожидает проверки
                            </span>
                            <h3>{event.title}</h3>
                            <p>
                              {event.description || 'Описание не указано.'}
                            </p>
                            <div className="admin-meta">
                              <span>
                                Дата: {value(event.date, event.event_date) || 'Не указана'}
                              </span>
                              <span>
                                Место: {event.location || 'Не указано'}
                              </span>
                              <span>
                                Время: {value(event.startTime, event.start_time) || 'Не указано'}
                              </span>
                            </div>
                          </div>

                          <div className="admin-actions">
                            <button
                              className="admin-approve"
                              onClick={() => {
                                setSelectedEvent(event);
                                setShowRejectForm(false);
                                setRejectionReason('');
                                setError('');
                              }}
                            >
                              Подробнее
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="admin-request-details">
                  <button
                    className="admin-back"
                    onClick={() => {
                      setSelectedEvent(null);
                      setShowRejectForm(false);
                      setError('');
                    }}
                  >
                    ← Назад к заявкам
                  </button>

                  <div className="admin-detail-header">
                    <div>
                      <span className="admin-status">
                        Заявка на рассмотрении
                      </span>
                      <h2>{selectedEvent.title}</h2>
                      <p>Проверь все сведения перед принятием решения.</p>
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
                        {value(selectedEvent.capacity, selectedEvent.seats)}
                      </Detail>
                    </div>
                  </section>

                  <section className="admin-detail-section">
                    <h3>Дата и место проведения</h3>
                    <div className="admin-detail-grid">
                      <Detail label="Дата">
                        {value(selectedEvent.date, selectedEvent.event_date)}
                      </Detail>
                      <Detail label="Начало">
                        {value(selectedEvent.startTime, selectedEvent.start_time)}
                      </Detail>
                      <Detail label="Окончание">
                        {value(selectedEvent.endTime, selectedEvent.end_time)}
                      </Detail>
                      <Detail label="Место / аудитория">
                        {value(selectedEvent.location, selectedEvent.venue)}
                      </Detail>
                    </div>

                    <p className="admin-schedule-note">
                      Перед одобрением необходимо проверить, нет ли
                      пересечения с другими мероприятиями в этом месте.
                      Автоматическая проверка появится после подключения
                      соответствующей логики на сервере.
                    </p>
                  </section>

                  <section className="admin-detail-section">
                    <h3>Автор и контакты</h3>
                    <div className="admin-detail-grid">
                      <Detail label="Имя автора">
                        {value(
                          selectedEvent.user?.firstName,
                          selectedEvent.user?.first_name,
                          selectedEvent.author?.name,
                          selectedEvent.userName,
                          selectedEvent.user_name,
                          selectedEvent.organizerName,
                          selectedEvent.organizer_name
                        )}
                      </Detail>
                      <Detail label="Email">
                        {value(
                          selectedEvent.user?.email,
                          selectedEvent.author?.email,
                          selectedEvent.userEmail,
                          selectedEvent.user_email,
                          selectedEvent.organizerEmail,
                          selectedEvent.organizer_email
                        )}
                      </Detail>
                      <Detail label="Телефон">
                        {value(
                          selectedEvent.phone,
                          selectedEvent.contactPhone,
                          selectedEvent.contact_phone,
                          selectedEvent.organizerPhone,
                          selectedEvent.organizer_phone
                        )}
                      </Detail>
                    </div>
                  </section>

                  <section className="admin-detail-section">
                    <h3>Организация мероприятия</h3>
                    <div className="admin-detail-grid">
                      <Detail label="Сообщение администрации">
                        {value(
                          selectedEvent.adminMessage,
                          selectedEvent.admin_message,
                          selectedEvent.organizerMessage,
                          selectedEvent.organizer_message
                        )}
                      </Detail>
                      <Detail label="Что требуется">
                        {value(
                          selectedEvent.requirements,
                          selectedEvent.neededResources,
                          selectedEvent.needed_resources
                        )}
                      </Detail>
                    </div>
                  </section>

                  <section className="admin-decision">
                    <h3>Решение администратора</h3>
                    <p>
                      При отклонении укажи причину, чтобы автор понимал,
                      что необходимо исправить.
                    </p>

                    {!showRejectForm ? (
                      <div className="admin-decision-buttons">
                        <button
                          className="admin-approve"
                          onClick={() => updateEvent('approved')}
                        >
                          Одобрить заявку
                        </button>
                        <button
                          className="admin-reject"
                          onClick={() => setShowRejectForm(true)}
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
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Например, аудитория уже занята в это время..."
                          rows={4}
                        />
                        <div className="admin-decision-buttons">
                          <button
                            className="admin-reject"
                            disabled={!rejectionReason.trim()}
                            onClick={() => updateEvent('rejected')}
                          >
                            Подтвердить отклонение
                          </button>
                          <button
                            className="admin-back"
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

          {activeTab === 'messages' && (
            <>
              <div className="admin-section-heading">
                <h2>Обратная связь</h2>
                <span>{messages.length} сообщений</span>
              </div>

              {messages.length === 0 ? (
                <div className="admin-empty">
                  Сообщений пока нет или API ещё не подключён.
                </div>
              ) : (
                <div className="admin-list">
                  {messages.map((message) => (
                    <article className="admin-item" key={message.id}>
                      <div className="admin-item-info">
                        <span className="admin-status">
                          {message.status === 'processed'
                            ? 'Обработано'
                            : 'Новое сообщение'}
                        </span>
                        <h3>{message.subject || 'Без темы'}</h3>
                        <p>{message.message || message.text}</p>
                        <div className="admin-meta">
                          <span>{message.name}</span>
                          <span>{message.email}</span>
                        </div>
                      </div>

                      {message.status !== 'processed' && (
                        <button
                          className="admin-approve"
                          onClick={() => markMessage(message)}
                        >
                          Обработано
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'users' && (
            <>
              <div className="admin-section-heading">
                <h2>Пользователи</h2>
                <span>{users.length} пользователей</span>
              </div>

              {users.length === 0 ? (
                <div className="admin-empty">
                  Список пуст или маршрут пользователей ещё не подключён.
                </div>
              ) : (
                <div className="admin-users-table">
                  <div className="admin-user-row admin-user-header">
                    <span>Пользователь</span>
                    <span>Email</span>
                    <span>Роль</span>
                  </div>

                  {users.map((user) => (
                    <div className="admin-user-row" key={user.id}>
                      <span>
                        {value(user.firstName, user.first_name, user.name)}{' '}
                        {value(user.lastName, user.last_name)}
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
