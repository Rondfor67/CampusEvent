
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function getUser() {
  try {
    if (!localStorage.getItem('token')) return null;

    return JSON.parse(
      localStorage.getItem('user') || 'null'
    );
  } catch {
    return null;
  }
}

export default function Footer() {
  const [user, setUser] = useState(getUser);

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

  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'user';

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <strong>✦ CampusEvents</strong>
          <p>Твоя студенческая жизнь начинается здесь.</p>
        </div>

        <div>
          <Link to="/events">Мероприятия</Link>

          {isStudent && (
            <Link to="/tickets">Мои билеты</Link>
          )}

          {!isAdmin && (
            <Link to="/contacts">Контакты</Link>
          )}

          {isAdmin && (
            <Link to="/admin">Админ-панель</Link>
          )}
        </div>

        <span>
          © {new Date().getFullYear()} CampusEvents
        </span>
      </div>
    </footer>
  );
}
