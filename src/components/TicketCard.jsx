
import { QRCodeSVG } from "qrcode.react";

function TicketCard({ ticket }) {
  return (
    <article className="ticket-card">
      <div className="ticket-card-info">
        <span className="event-category">ЭЛЕКТРОННЫЙ БИЛЕТ</span>

        <h2>{ticket.eventTitle || `Мероприятие №${ticket.eventId}`}</h2>

        <p>
          <strong>Участник:</strong> {ticket.studentName}
        </p>

        <p>
          <strong>Email:</strong> {ticket.email}
        </p>

        <p>
          <strong>Дата регистрации:</strong>{" "}
          {ticket.createdAt
            ? new Date(ticket.createdAt).toLocaleDateString("ru-RU")
            : "Не указана"}
        </p>

        <p>
          <strong>Статус:</strong>{" "}
          {ticket.checkedIn ? "Посещение подтверждено" : "Действителен"}
        </p>
      </div>

      <div className="ticket-qr">
        <QRCodeSVG
        value={ticket.ticketCode}
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
