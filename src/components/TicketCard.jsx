
import { QRCodeSVG } from 'qrcode.react';

function TicketCard({ ticket }) {
  const ticketUrl = `${window.location.origin}/tickets/${encodeURIComponent(
    ticket.ticketCode
  )}`;

  return (
    <article className="ticket-card">
      <div className="ticket-card-info">
        <span className="event-category">
          ЭЛЕКТРОННЫЙ БИЛЕТ
        </span>

        <h2>{ticket.eventTitle}</h2>

        <p>
          <strong>Участник:</strong>{' '}
          {ticket.studentName || 'Не указан'}
        </p>

        <p>
          <strong>Email:</strong>{' '}
          {ticket.email || 'Не указан'}
        </p>

        <p>
          <strong>Дата мероприятия:</strong>{' '}
          {ticket.date
            ? new Date(ticket.date).toLocaleString('ru-RU')
            : 'Не указана'}
        </p>

        <p>
          <strong>Место:</strong>{' '}
          {ticket.location || 'Не указано'}
        </p>

        <p>
          <strong>Статус:</strong>{' '}
          {ticket.status === 'used'
            ? 'Посещение подтверждено'
            : ticket.status === 'cancelled'
              ? 'Аннулирован'
              : 'Действителен'}
        </p>
      </div>

      <div className="ticket-qr">
        <QRCodeSVG
          value={ticketUrl}
          size={180}
          level="M"
          includeMargin
        />

        <p>Покажите QR-код организатору на входе</p>
      </div>
    </article>
  );
}

export default TicketCard;
