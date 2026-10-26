
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <section className="not-found">
      <div className="not-found-code">404</div>

      <h1>Упс! Страница не найдена</h1>

      <p>
        Кажется, это мероприятие потерялось!
        Возможно, страница была удалена
        или адрес введён неправильно.
      </p>

      <Link to="/" className="not-found-button">
        Вернуться на главную
      </Link>
    </section>
  );
}

export default NotFound;
