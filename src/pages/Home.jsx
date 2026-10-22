import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEvents } from '../services/api';
import EventCard from '../components/EventCard';
export default function Home(){
 const [events,setEvents]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 useEffect(()=>{getEvents().then(setEvents).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[]);
 return <div className="home-page"><section className="hero"><div className="hero-shade"/><div className="hero-content container">
  <span className="eyebrow">✦ CAMPUS LIFE</span><h1>Твоя студенческая<br/>жизнь начинается<br/>здесь.</h1>
  <p>Новые знакомства, яркие впечатления и мероприятия, которые ты не захочешь пропустить.</p>
  <Link className="btn btn-primary" to="/events">Исследовать мероприятия ↗</Link></div></section>
  <section className="events-section container"><div className="section-heading"><div><span className="eyebrow">НЕ ПРОПУСТИ</span><h2>Ближайшие мероприятия</h2><p>Выбери следующее событие в своём кампусе</p></div><Link className="text-link" to="/events">Все мероприятия →</Link></div>
  {loading && <p role="status">Загружаем мероприятия...</p>}{error && <p role="alert">Не удалось загрузить мероприятия: {error}. Убедись, что backend запущен.</p>}
  {!loading && !error && (events.length ? <div className="events-grid">{events.slice(0,6).map(event=><EventCard key={event.id} event={event}/>)}</div> : <p>Пока мероприятий нет.</p>)}
  </section><section className="feature-strip"><div className="container feature-grid"><div><strong>01 ✦</strong><h3>Выбирай</h3><p>Находи события по интересам</p></div><div><strong>02 ✦</strong><h3>Регистрируйся</h3><p>Получай билет с QR-кодом</p></div><div><strong>03 ✦</strong><h3>Участвуй</h3><p>Создавай незабываемые моменты</p></div></div></section></div>
}
