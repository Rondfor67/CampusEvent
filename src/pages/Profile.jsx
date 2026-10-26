
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const statusInfo = {
  pending: {
    label: 'На рассмотрении',
    className: 'pending',
  },
  approved: {
    label: 'Одобрено',
    className: 'approved',
  },
  rejected: {
    label: 'Отклонено',
    className: 'rejected',
  },
};

function getStoredUser() {
  try {
    if (!localStorage.getItem('token')) return null;
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

function formatDate(value) {
  if (!value) return 'Дата не указана';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Дата не указана';

  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Asia/Almaty',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatTime(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Asia/Almaty',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function Profile() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(getStoredUser);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState('');

  const token = localStorage.getItem('token');
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isMember = ['user', 'teacher'].includes(user?.role);

  const roleLabel = isAdmin
    ? 'Администратор'
    : isTeacher
      ? 'Преподаватель'
      : 'Студент';

  useEffect(() => {
    function updateUser() {
      setUser(getStoredUser());
    }

    window.addEventListener('authChanged', updateUser);
    window.addEventListener('auth-change', updateUser);
    window.addEventListener('storage', updateUser);

    return () => {
      window.removeEventListener('authChanged', updateUser);
      window.removeEventListener('auth-change', updateUser);
      window.removeEventListener('storage', updateUser);
    };
  }, []);

  useEffect(() => {
    if (!user || !token || !isMember) {
      setLoading(false);
      setApplications([]);
      return;
    }

    const controller = new AbortController();

    async function loadApplications() {
      try {
        setLoading(true);
        setApplicationsError('');

        const response = await fetch(`${API_URL}/applications/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message || 'Не удалось загрузить заявки'
          );
        }

        if (!Array.isArray(data)) {
          throw new Error('Сервер вернул некорректные данные');
        }

        // Дополнительная защита: не отображаем отменённые мероприятия,
        // если API передаёт статус связанного Event.
        setApplications(data.filter((application) => application.eventStatus !== 'cancelled'));
      } catch (error) {
        if (error.name !== 'AbortError') {
          setApplicationsError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadApplications();

    return () => controller.abort();
  }, [token, user?.id, isMember]);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    window.dispatchEvent(new Event('authChanged'));
    window.dispatchEvent(new Event('auth-change'));

    setUser(null);
    navigate('/login', { replace: true });
  }

  if (!user || !token) {
    return (
      <section className="profile-page">
        <div className="profile-card">
          <h1>Мой профиль</h1>
          <p>Чтобы посмотреть профиль, войди в аккаунт.</p>

          <Link to="/login" className="btn btn-primary">
            Войти
          </Link>
        </div>
      </section>
    );
  }

  const fullName = user.full_name || 'Пользователь';

  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <section className="profile-page">
      <div className="profile-container">
        <div className="profile-intro">
          <p className="auth-eyebrow">
            {isAdmin ? 'ПАНЕЛЬ УПРАВЛЕНИЯ' : 'ТВОЙ АККАУНТ'}
          </p>

          <h1>Мой профиль</h1>

          <p>
            {isAdmin
              ? 'Управляй заявками, пользователями и обращениями.'
              : isTeacher
                ? 'Создавай мероприятия для студентов и следи за своими заявками.'
                : 'Управляй своим аккаунтом и следи за событиями кампуса.'}
          </p>
        </div>

        {location.state?.success && (
          <div className="profile-success" role="status">
            ✓ {location.state.success}
          </div>
        )}

        <div className="profile-card">
          <div className="profile-user">
            <div className="profile-avatar">
              {initials}
            </div>

            <div className="profile-user-info">
              <span className="profile-role">
                {roleLabel}
              </span>

              <h2>{fullName}</h2>
              <p>{user.email}</p>
            </div>
          </div>

          <div className="profile-divider" />

          <div className="profile-details">
            <div className="profile-detail">
              <span>Полное имя</span>
              <strong>{fullName}</strong>
            </div>

            <div className="profile-detail">
              <span>Электронная почта</span>
              <strong>{user.email}</strong>
            </div>

            <div className="profile-detail">
              <span>Тип аккаунта</span>
              <strong>{roleLabel}</strong>
            </div>
          </div>
        </div>

        <div className="profile-actions-card">
          <h2>
            {isAdmin ? 'Управление платформой' : 'Мои возможности'}
          </h2>

          <p>
            {isAdmin
              ? 'Проверяй заявки и управляй работой CampusEvents.'
              : 'Все мероприятия и билеты в одном месте.'}
          </p>

          <div className="profile-actions">
            {isAdmin ? (
              <Link to="/admin" className="profile-action">
                <span>Панель администратора</span>
                <span>→</span>
              </Link>
            ) : (
              <>
                <Link to="/events" className="profile-action">
                  <span>Календарь мероприятий</span>
                  <span>→</span>
                </Link>

                <Link to="/tickets" className="profile-action">
                  <span>Мои билеты</span>
                  <span>→</span>
                </Link>

                <Link
                  to="/events/create"
                  className="profile-action"
                >
                  <span>
                    {isTeacher
                      ? 'Создать официальное мероприятие'
                      : 'Создать мероприятие'}
                  </span>
                  <span>→</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {isMember && (
          <div className="profile-applications-card">
            <div className="profile-applications-heading">
              <div>
                <h2>Мои заявки</h2>

                <p>
                  Следи за рассмотрением своих мероприятий.
                </p>
              </div>

              <Link
                to="/events/create"
                className="btn btn-primary"
              >
                + Создать заявку
              </Link>
            </div>

            {loading ? (
              <p>Загружаем заявки...</p>
            ) : applicationsError ? (
              <p
                className="create-event-message"
                role="alert"
              >
                {applicationsError}
              </p>
            ) : applications.length === 0 ? (
              <div className="profile-applications-empty">
                <p>
                  У тебя пока нет заявок на мероприятия.
                </p>
              </div>
            ) : (
              <div className="profile-applications-list">
                {applications.map((application) => {
                  const status =
                    statusInfo[application.status] ||
                    statusInfo.pending;

                  return (
                    <div
                      className="profile-application"
                      key={application._id}
                    >
                      <div className="profile-application-top">
                        <div>
                          <h3>{application.title}</h3>
                          <p>{application.category}</p>
                        </div>

                        <span
                          className={`profile-application-status ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="profile-application-details">
                        <p>
                          <strong>Дата:</strong>{' '}
                          {formatDate(application.startAt)}
                        </p>

                        <p>
                          <strong>Время:</strong>{' '}
                          {formatTime(application.startAt)}
                          {' — '}
                          {formatTime(application.endAt)}
                        </p>

                        <p>
                          <strong>Место:</strong>{' '}
                          {application.venue?.name || 'Не указано'}
                          {application.venue?.building
                            ? `, ${application.venue.building}`
                            : ''}
                        </p>

                        <p>
                          <strong>Мест:</strong>{' '}
                          {application.capacity}
                        </p>
                      </div>

                      {application.status === 'approved' && application.requestType !== 'update' && (
                        <Link className="btn btn-secondary" to={`/events/edit/${application._id}`}>
                          Отправить запрос на редактирование
                        </Link>
                      )}
                      {application.requestType === 'update' && (
                        <p className="profile-application-reason">Тип заявки: Обновить данные</p>
                      )}

                      {application.status === 'rejected' &&
                        application.rejectionReason && (
                          <p className="profile-application-reason">
                            <strong>Причина отклонения:</strong>{' '}
                            {application.rejectionReason}
                          </p>
                        )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          className="profile-logout"
          onClick={handleLogout}
        >
          Выйти из аккаунта
        </button>
      </div>
    </section>
  );
}

export default Profile;
