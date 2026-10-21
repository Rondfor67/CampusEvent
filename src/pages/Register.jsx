
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Пароль должен содержать не менее 8 символов.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Пароли не совпадают.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || 'Не удалось создать аккаунт.'
        );
      }

      // После регистрации предлагаем войти в аккаунт.
      navigate('/login', {
        state: { message: 'Аккаунт создан! Теперь войди в систему.' },
      });
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Не удалось связаться с сервером. Проверь, запущен ли backend.'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card auth-card-register">
        <Link to="/" className="auth-back">
          ← На главную
        </Link>

        <div className="auth-heading">
          <span className="auth-symbol">GC</span>
          <p className="auth-eyebrow">Твой кампус. Твои события.</p>
          <h1>Создать аккаунт</h1>
          <p>Регистрируйся, находи мероприятия и встречай новых людей.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-name-row">
            <div className="auth-field">
              <label htmlFor="register-first-name">Имя</label>
              <input
                id="register-first-name"
                name="firstName"
                placeholder="Твоё имя"
                value={form.firstName}
                onChange={handleChange}
                autoComplete="given-name"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-last-name">Фамилия</label>
              <input
                id="register-last-name"
                name="lastName"
                placeholder="Твоя фамилия"
                value={form.lastName}
                onChange={handleChange}
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />

          <label htmlFor="register-password">Пароль</label>
          <input
            id="register-password"
            name="password"
            type="password"
            placeholder="Минимум 8 символов"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={8}
            required
          />

          <label htmlFor="register-confirm-password">
            Повтори пароль
          </label>
          <input
            id="register-confirm-password"
            name="confirmPassword"
            type="password"
            placeholder="Введи пароль ещё раз"
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={8}
            required
          />

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button
            className="btn btn-primary auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="auth-switch">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>

        <p className="auth-note">
          Присоединяйся к сообществу Go Campus.
        </p>
      </div>
    </section>
  );
}

export default Register;
