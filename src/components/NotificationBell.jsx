
import { useCallback, useEffect, useRef, useState } from 'react';
import './NotificationBell.css';

import megaphoneIcon from '../assets/notifications/megaphone.png';
import alertMarksIcon from '../assets/notifications/alert-marks.png';
import { useLocation } from 'react-router-dom';

const API = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export default function NotificationBell({ user }) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [items, setItems] = useState([]);
  const [opened, setOpened] = useState(false);
  const [toast, setToast] = useState(null);

  const containerRef = useRef(null);
  const busy = useRef(false);

  const token = localStorage.getItem('token');
  const account = user?._id || user?.id || user?.email;

  const api = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API}/notifications${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.message || `Ошибка уведомлений (${response.status})`
      );
    }

    return data;
  }, [token]);


  
const refresh = useCallback(async () => {
  if (!token || !account || busy.current) return;

  busy.current = true;

  try {
    const data = await api('/');
    setItems(Array.isArray(data) ? data : []);

    // Новое всплывающее уведомление получаем
    // только на главной странице.
    if (isHomePage) {
      const newest = await api('/claim-popup', {
        method: 'POST',
      });

      if (newest) {
        setToast((current) => current || newest);

        setItems((previous) =>
          previous.map((item) =>
            item._id === newest._id ? newest : item
          )
        );
      }
    }
  } catch (error) {
    console.error('Ошибка уведомлений:', error);
  } finally {
    busy.current = false;
  }
}, [api, token, account, isHomePage]);

  

  useEffect(() => {
    setItems([]);
    setToast(null);
    setOpened(false);

    if (!token || !account) return;

    refresh();

    const interval = setInterval(refresh, 30000);

    return () => clearInterval(interval);
  }, [account, token, refresh]);

  // Закрытие всплывающего сообщения при
  // взаимодействии с сайтом.
  // Закрытие центра при клике снаружи.
  useEffect(() => {
    function handlePointerDown(event) {
      const container = containerRef.current;
      const target = event.target;

      if (!container || !(target instanceof Node)) return;

      const toastElement = container.querySelector(
        '.notification-toast'
      );

      const clickedToast = toastElement?.contains(target);

      if (!clickedToast) {
        setToast(null);
      }

      if (!container.contains(target)) {
        setOpened(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setToast(null);
        setOpened(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  async function readNotification(item) {
    setToast(null);

    if (item.readAt) return;

    try {
      const updated = await api(`/${item._id}/read`, {
        method: 'PATCH',
      });

      setItems((previous) =>
        previous.map((notification) =>
          notification._id === item._id
            ? updated
            : notification
        )
      );
    } catch (error) {
      console.error('Ошибка прочтения:', error);
    }
  }

  function toggleNotifications() {
    setToast(null);
    setOpened((previous) => !previous);
  }

  function openNotifications() {
    setToast(null);
    setOpened(true);
  }
  useEffect(() => {
    if (!isHomePage) {
      setToast(null);
    }
  }, [isHomePage]);
  const unread = items.filter((item) => !item.readAt).length;

  return (
    <div className="notification-anchor" ref={containerRef}>
      {/* МЕГАФОН В ШАПКЕ */}
      <button
        type="button"
        className="notification-bell"
        title="Уведомления"
        aria-label={`Уведомления, непрочитанных: ${unread}`}
        aria-expanded={opened}
        onClick={toggleNotifications}
      >
        <img
          className="notification-megaphone"
          src={megaphoneIcon}
          alt=""
          aria-hidden="true"
        />

        {unread > 0 && (
          <span className="notification-count">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* ЦЕНТР УВЕДОМЛЕНИЙ */}
      {opened && (
        <div
          className="notification-panel"
          role="region"
          aria-label="Центр уведомлений"
        >
          <div className="notification-panel-top">
            <strong>Уведомления</strong>

            <button
              type="button"
              onClick={() => setOpened(false)}
              aria-label="Закрыть уведомления"
            >
              ×
            </button>
          </div>

          {items.length === 0 ? (
            <p className="notification-empty">
              Уведомлений пока нет
            </p>
          ) : (
            <div className="notification-list">
              {items.map((item) => (
                <button
                  type="button"
                  key={item._id}
                  className={`notification-item ${
                    item.readAt ? '' : 'unread'
                  }`}
                  onClick={() => readNotification(item)}
                >
                  <strong>{item.title}</strong>

                  <span>{item.message}</span>

                  <small>
                    {new Date(item.createdAt).toLocaleString(
                      'ru-RU',
                      { timeZone: 'Asia/Almaty' }
                    )}
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ВСПЛЫВАЮЩЕЕ УВЕДОМЛЕНИЕ */}
      {toast && !opened && isHomePage && (
        <div className="notification-toast" role="status">
          <img
            className="notification-toast-icon"
            src={alertMarksIcon}
            alt=""
            aria-hidden="true"
          />

          <div className="notification-toast-body">
            <strong>{toast.title}</strong>

            <p>{toast.message}</p>

            <button
              type="button"
              onClick={openNotifications}
            >
              Посмотреть уведомления
            </button>
          </div>

          <button
            type="button"
            className="notification-toast-close"
            onClick={() => setToast(null)}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
