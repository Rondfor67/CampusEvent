
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    role: 'user',
    firstName: '',
    lastName: '',
    iin: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'iin'
          ? value.replace(/\D/g, '').slice(0, 12)
          : name === 'phone'
            ? value.replace(/[^\d+\s()-]/g, '').slice(0, 20)
            : value,
    }));

    setError('');
  }

  function isValidIin(iin) {
    if (!/^\d{12}$/.test(iin)) return false;

    const year = Number(iin.slice(0, 2));
    const month = Number(iin.slice(2, 4));
    const day = Number(iin.slice(4, 6));
    const centuryCode = Number(iin[6]);

    if (![1, 2, 3, 4, 5, 6].includes(centuryCode)) {
      return false;
    }

    const century =
      centuryCode <= 2 ? 1800 :
      centuryCode <= 4 ? 1900 : 2000;

    const fullYear = century + year;

    const date = new Date(Date.UTC(fullYear, month - 1, day));

    return (
      date.getUTCFullYear() === fullYear &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }

  function isAllowedIin(iin, role) {
    if (!isValidIin(iin)) return false;

    if (role === 'teacher') {
      return true;
    }

    const year = Number(iin.slice(0, 2));
    const centuryCode = Number(iin[6]);
    const fullYear = 2000 + year;

    return (
      [5, 6].includes(centuryCode) &&
      fullYear >= 2008 &&
      fullYear <= 2011
    );
  }

  function normalizePhone(phone) {
    const cleaned = phone.replace(/[\s()-]/g, '');

    if (/^8\d{10}$/.test(cleaned)) {
      return '+7' + cleaned.slice(1);
    }

    if (/^7\d{10}$/.test(cleaned)) {
      return '+' + cleaned;
    }

    if (/^\+7\d{10}$/.test(cleaned)) {
      return cleaned;
    }

    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const phone = normalizePhone(form.phone);

    if (!firstName || !lastName) {
      setError('Введите имя и фамилию.');
      return;
    }

    if (!isAllowedIin(form.iin, form.role)) {
      setError(
        form.role === 'teacher'
          ? 'Проверьте ИИН преподавателя. Он должен содержать 12 цифр и корректную дату рождения.'
          : 'Проверьте ИИН. Регистрация доступна студентам 2008–2011 годов рождения.'
      );
      return;
    }

    if (!phone) {
      setError(
        'Введите корректный номер телефона Казахстана, например +7 700 123 45 67.'
      );
      return;
    }

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
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: form.role,
          iin: form.iin,
          full_name: `${lastName} ${firstName}`,
          email: form.email.trim().toLowerCase(),
          phone,
          password: form.password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          'Не удалось создать аккаунт.'
        );
      }

      navigate('/login', {
        state: {
          message: 'Аккаунт создан! Теперь войди в систему.',
        },
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

          <p className="auth-eyebrow">
            Твой кампус. Твои события.
          </p>

          <h1>Создать аккаунт</h1>

          <p>
            Регистрируйся, находи мероприятия
            и встречай новых людей.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="register-role">
            Кто вы?
          </label>

          <select
            id="register-role"
            name="role"
            value={form.role}
            onChange={handleChange}
            required
          >
            <option value="user">Студент</option>
            <option value="teacher">Преподаватель</option>
          </select>

          <div className="auth-name-row">
            <div className="auth-field">
              <label htmlFor="register-first-name">
                Имя
              </label>

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
              <label htmlFor="register-last-name">
                Фамилия
              </label>

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

          <label htmlFor="register-iin">
            ИИН
          </label>

          <input
            id="register-iin"
            name="iin"
            type="text"
            inputMode="numeric"
            placeholder="12 цифр"
            value={form.iin}
            onChange={handleChange}
            maxLength={12}
            autoComplete="off"
            required
          />

          <label htmlFor="register-email">
            Email
          </label>

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

          <label htmlFor="register-phone">
            Номер телефона
          </label>

          <input
            id="register-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="+7 700 123 45 67"
            value={form.phone}
            onChange={handleChange}
            autoComplete="tel"
            maxLength={20}
            required
          />

          <label htmlFor="register-password">
            Пароль
          </label>

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
            {loading
              ? 'Создаём аккаунт...'
              : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="auth-switch">
          Уже есть аккаунт?{' '}
          <Link to="/login">Войти</Link>
        </p>

        <p className="auth-note">
          Присоединяйся к сообществу Go Campus.
        </p>
      </div>
    </section>
  );
}

export default Register;
