
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import campusLogo from '../assets/campusevents-logo.png';

function getStoredUser() {
  try {
    const token = localStorage.getItem('token');

    if (!token) return null;

    return JSON.parse(
      localStorage.getItem('user') || 'null'
    );
  } catch {
    return null;
  }
}

function Header() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(getStoredUser);

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

  const isAdmin = user?.role === 'admin';
  const isMember = ['user', 'teacher'].includes(user?.role);

  return (
    <header className="site-header">
      <div className="nav-wrap">
        
        <Link className="brand" to="/">
          <img
            src={campusLogo}
            alt=""
            className="campus-logo-icon"
          />

          <span>
            Campus<span>Events</span>
          </span>
        </Link>


        <button
          className="mobile-toggle"
          aria-label="Открыть меню"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>

        <nav
          className={`nav-links ${open ? 'expanded' : ''}`}
          onClick={() => setOpen(false)}
        >
          <NavLink to="/" end>
            Главная
          </NavLink>

          <NavLink to="/events">
            Мероприятия
          </NavLink>

          {isMember && (
            <NavLink to="/tickets">
              Мои билеты
            </NavLink>
          )}

          {!isAdmin && (
            <NavLink to="/contacts">
              Контакты
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/admin">
              Админ-панель
            </NavLink>
          )}
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <NotificationBell user={user} />
              <Link
              to="/profile"
              className="header-profile"
              title="Мой профиль"
              aria-label="Мой профиль"
            >
              <svg
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
              </svg>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="btn btn-secondary"
              >
                Войти
              </Link>

              <Link
                to="/register"
                className="btn btn-primary"
              >
                Регистрация ↗
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
