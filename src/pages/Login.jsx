
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });

    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password) {
      setError('Заполни все поля.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          'Не удалось войти. Проверь email и пароль.'
        );
      }

      if (!data.token || !data.user) {
        throw new Error('Сервер вернул неполные данные авторизации.');
      }

      // Сохраняем токен и данные пользователя
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Сообщаем Header.jsx, что пользователь вошёл
      window.dispatchEvent(new Event('auth-change'));

      // Перенаправляем в зависимости от роли
      if (data.user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }

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
      <div className="auth-card">
        <Link to="/" className="auth-back">
          ← На главную
        </Link>

        <div className="auth-heading">
          <span className="auth-symbol">GC</span>
          <p className="auth-eyebrow">С возвращением!</p>
          <h1>Войти в аккаунт</h1>
          <p>
            Продолжай открывать новые события вместе с Go Campus.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">
            Email
          </label>

          <input
            id="login-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />

          <label htmlFor="login-password">
            Пароль
          </label>

          <input
            id="login-password"
            name="password"
            type="password"
            placeholder="Введи пароль"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="btn btn-primary auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <p className="auth-switch">
          Ещё нет аккаунта?{' '}
          <Link to="/register">
            Зарегистрироваться
          </Link>
        </p>

        <p className="auth-note">
          Твой следующий интересный опыт начинается здесь.
        </p>
      </div>
    </section>
  );
}

export default Login;
