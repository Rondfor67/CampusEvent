import { useState } from 'react';

const contactItems = [
  {
    icon: '✉',
    title: 'Электронная почта',
    value: 'campusevents@college.kz',
    description: 'Для вопросов и предложений',
  },
  {
    icon: '✦',
    title: 'Мероприятия',
    value: 'Есть интересная идея?',
    description: 'Предложи своё мероприятие нашей команде',
  },
  {
    icon: '◷',
    title: 'Поддержка',
    value: 'Мы готовы помочь',
    description: 'Ответим на вопросы о работе платформы',
  },
];

function Contacts() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [notice, setNotice] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setNotice('');
  }

  function handleSubmit(event) {
    event.preventDefault();

    // Пока серверная отправка сообщений не подключена.
    setNotice(
      'Форма заполнена! Отправка сообщений пока не подключена к серверу.',
    );
  }

  return (
    <div className="contacts-page">
      <section className="contacts-hero">
        <div className="contacts-container contacts-hero-inner">
          <div className="contacts-hero-content">
            <span className="eyebrow">КОНТАКТЫ</span>

            <h1>
              Давай
              <br />
              <span>будем на связи!</span>
            </h1>

            <p>
              Есть вопросы, предложения или интересные идеи?
              Мы здесь, чтобы помочь тебе сделать студенческую
              жизнь ярче.
            </p>

            <a href="#contact-form" className="btn btn-primary">
              Написать нам <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="contacts-illustration" aria-hidden="true">
            <div className="contacts-illustration-circle" />
            <div className="contacts-envelope">
              <span>✉</span>
            </div>
            <span className="contacts-decoration contacts-decoration-one">
              ✳
            </span>
            <span className="contacts-decoration contacts-decoration-two">
              ✦
            </span>
          </div>
        </div>
      </section>

      <section className="contacts-info-section">
        <div className="contacts-container">
          <div className="section-heading contacts-heading">
            <div>
              <span className="eyebrow">МЫ РЯДОМ</span>
              <h2>Чем можем помочь?</h2>
              <p>
                Выбери подходящий способ связи или оставь сообщение.
              </p>
            </div>
          </div>

          <div className="contacts-info-grid">
            {contactItems.map((item) => (
              <article className="contacts-info-card" key={item.title}>
                <div className="contacts-info-icon" aria-hidden="true">
                  {item.icon}
                </div>

                <div className="contacts-info-content">
                  <h3>{item.title}</h3>
                  <p className="contacts-info-value">{item.value}</p>
                  <p className="contacts-info-description">
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="contacts-form-section" id="contact-form">
        <div className="contacts-container contacts-form-layout">
          <div className="contacts-form-card">
            <span className="eyebrow">ОБРАТНАЯ СВЯЗЬ</span>
            <h2>Напиши нам</h2>
            <p className="contacts-form-intro">
              Заполни форму, и мы сможем разобраться в твоём вопросе.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="contacts-fields-row">
                <label className="contacts-field">
                  Твоё имя
                  <input
                    name="name"
                    type="text"
                    placeholder="Как тебя зовут?"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="contacts-field">
                  Электронная почта
                  <input
                    name="email"
                    type="email"
                    placeholder="example@email.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>

              <label className="contacts-field">
                Тема сообщения
                <input
                  name="subject"
                  type="text"
                  placeholder="О чём хочешь спросить?"
                  value={form.subject}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="contacts-field">
                Сообщение
                <textarea
                  name="message"
                  placeholder="Расскажи подробнее..."
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  required
                />
              </label>

              <button type="submit" className="btn btn-primary contacts-submit">
                Отправить сообщение <span aria-hidden="true">↗</span>
              </button>

              {notice && (
                <p className="contacts-notice" role="status">
                  {notice}
                </p>
              )}
            </form>
          </div>

          <aside className="contacts-side-card">
            <span className="contacts-side-label">CAMPUS EVENTS</span>

            <h2>Твоя идея может стать следующим большим событием.</h2>

            <p>
              Хочешь организовать мастер-класс, встречу или фестиваль?
              Предложи мероприятие через свой аккаунт. После одобрения
              администратора оно появится в общем каталоге.
            </p>

            <div className="contacts-side-divider" />

            <div className="contacts-side-tip">
              <span className="contacts-tip-icon" aria-hidden="true">
                ✦
              </span>
              <div>
                <strong>Есть идея?</strong>
                <p>
                  Войди в аккаунт, чтобы предложить своё мероприятие.
                </p>
              </div>
            </div>

            <a href="/login" className="contacts-side-link">
              Войти в аккаунт <span aria-hidden="true">→</span>
            </a>

            <span className="contacts-side-decoration" aria-hidden="true">
              ✳
            </span>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default Contacts;