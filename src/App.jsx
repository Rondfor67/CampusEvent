
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TicketDetails from "./pages/TicketDetails";
import Header from './components/Header';
import Footer from './components/Footer';

import Home from './pages/Home';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Tickets from './pages/Tickets';
import Contacts from './pages/Contacts';
import Admin from './pages/Admin';

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Header />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/ticket/:code" element={<TicketDetails />} />
        </Routes>
      </main>

      <Footer />
    </BrowserRouter>
  );
}

export default App;
