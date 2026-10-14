
import { Link, NavLink } from 'react-router-dom';

function Header() {
  return (
    <header className="header">
      <Link to="/" className="logo">
        CampusEvents
      </Link>

      <nav className="navigation">
        <NavLink to="/">Главная</NavLink>
        <NavLink to="/events">Мероприятия</NavLink>
        <NavLink to="/tickets">Мои билеты</NavLink>
        <NavLink to="/contacts">Контакты</NavLink>
      </nav>

      <div className="header-actions">
        <Link to="/login" className="login-link">
          Войти
        </Link>
        <Link to="/register" className="register-button">
          Регистрация
        </Link>
      </div>
    </header>
  );
}

export default Header;
