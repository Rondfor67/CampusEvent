
import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';

import Home from './pages/Home';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import CreateEvent from './pages/CreateEvent';

import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

import Tickets from './pages/Tickets';
import TicketDetails from './pages/TicketDetails';

import Contacts from './pages/Contacts';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

import './App.css';

function getCurrentUser() {
  try {
    if (!localStorage.getItem('token')) return null;

    return JSON.parse(
      localStorage.getItem('user') || 'null'
    );
  } catch {
    return null;
  }
}

//Проверка доступа к страницам
function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const [user, setUser] = useState(getCurrentUser);

  useEffect(() => {
    function updateAuth() {
      setUser(getCurrentUser());
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

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={user.role === 'admin' ? '/admin' : '/'}
        replace
      />
    );
  }

  return children;
}

//Доступ для гостей, студентов и преподавателей
function GuestOrMemberRoute({ children }) {
  const [user, setUser] = useState(getCurrentUser);

  useEffect(() => {
    function updateAuth() {
      setUser(getCurrentUser());
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

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Header />

      <main className="main-content">
        <Routes>
          {/* Доступно всем */}
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Профиль пользователя */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute
                allowedRoles={['user', 'teacher', 'admin']}
              >
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Создание мероприятия */}
          <Route
            path="/events/create"
            element={
              <ProtectedRoute
                allowedRoles={['user', 'teacher']}
              >
                <CreateEvent />
              </ProtectedRoute>
            }
          />

          {/* Редактирование заявки */}
          <Route
            path="/events/edit/:applicationId"
            element={
              <ProtectedRoute
                allowedRoles={['user', 'teacher']}
              >
                <CreateEvent />
              </ProtectedRoute>
            }
          />

          {/* Билеты студентов и преподавателей */}
          <Route
            path="/tickets"
            element={
              <ProtectedRoute
                allowedRoles={['user', 'teacher']}
              >
                <Tickets />
              </ProtectedRoute>
            }
          />

          {/* Проверка QR-билета */}
          <Route
            path="/tickets/:code"
            element={<TicketDetails />}
          />

          {/* Контакты */}
          <Route
            path="/contacts"
            element={
              <GuestOrMemberRoute>
                <Contacts />
              </GuestOrMemberRoute>
            }
          />

          {/* Только администратор */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* Страница 404 */}
          <Route
            path="*"
            element={<NotFound />}
          />
        </Routes>
      </main>

      <Footer />
    </BrowserRouter>
  );
}

export default App;
