import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
function Header() {
 const [open, setOpen] = useState(false);
 return <header className="site-header"><div className="nav-wrap">
  <Link className="brand" to="/"><span className="brand-mark">✦</span><span>Campus<span>Events</span></span></Link>
  <button className="mobile-toggle" aria-label="Открыть меню" aria-expanded={open} onClick={() => setOpen(!open)}>☰</button>
  <nav className={`nav-links ${open ? 'expanded' : ''}`} onClick={() => setOpen(false)}>
   <NavLink to="/" end>Главная</NavLink><NavLink to="/events">Мероприятия</NavLink><NavLink to="/tickets">Мои билеты</NavLink><NavLink to="/contacts">Контакты</NavLink>
  </nav><div className="nav-actions"><Link to="/login" className="btn btn-secondary">Войти</Link><Link to="/register" className="btn btn-primary">Регистрация ↗</Link></div>
 </div></header>;
}
export default Header;
