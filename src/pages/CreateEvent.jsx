

import { useEffect, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';



const API_URL = import.meta.env.VITE_API_URL || '/api';



const initialForm = {

  title: '',

  category: '',

  description: '',

  building: '',

  venue: '',

  date: '',

  startTime: '',

  endTime: '',

  capacity: '',

  phone: '',

  comment: '',

};



const CAMPUS_TIMEZONE = 'Asia/Almaty';



const MAX_PHOTOS = 6;

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;



const ALLOWED_PHOTO_TYPES = [

  'image/jpeg',

  'image/png',

  'image/webp',

];



function campusDate(date = new Date()) {

  return new Intl.DateTimeFormat('en-CA', {

    timeZone: CAMPUS_TIMEZONE,

    year: 'numeric',

    month: '2-digit',

    day: '2-digit',

  }).format(date);

}



function toCampusISO(date, time) {

  return `${date}T${time}:00+05:00`;

}



function formatTime(value) {

  return new Intl.DateTimeFormat('ru-RU', {

    timeZone: CAMPUS_TIMEZONE,

    hour: '2-digit',

    minute: '2-digit',

  }).format(new Date(value));

}



//korpusa v odnom formate

function normalizeBuilding(building) {

  return String(building || '')

    .trim()

    .replace(/^С/i, 'C')

    .replace(/^1\./, 'C1.');

}

//predprosmotr photo

function PhotoPreview({ file, index, onRemove }) {

  const [previewUrl, setPreviewUrl] = useState('');



  useEffect(() => {

    const url = URL.createObjectURL(file);



    setPreviewUrl(url);



    return () => {

      URL.revokeObjectURL(url);

    };

  }, [file]);



  return (

    <div className="event-upload-item">

      {previewUrl && (

        <img

          src={previewUrl}

          alt={`Фото мероприятия ${index + 1}`}

        />

      )}



      <div className="event-upload-item-bottom">

        <span>

          {index === 0

            ? 'Обложка'

            : `Фото ${index + 1}`}

        </span>



        <button

          type="button"

          className="event-upload-remove"

          onClick={onRemove}

          aria-label={`Удалить фото ${index + 1}`}

          title="Удалить фотографию"

        >

          ×

        </button>

      </div>

    </div>

  );

}



//create events


function CreateEvent() {

  const navigate = useNavigate();
  const { applicationId } = useParams();
  const isEditing = Boolean(applicationId);
  const [existingImages, setExistingImages] = useState([]);
  const [editingLoading, setEditingLoading] = useState(isEditing);



  const [form, setForm] = useState(initialForm);



  const [venues, setVenues] = useState([]);

  const [occupied, setOccupied] = useState([]);



  const [loadingVenues, setLoadingVenues] = useState(true);

  const [loadingAvailability, setLoadingAvailability] =

    useState(false);



  const [availabilityError, setAvailabilityError] =

    useState('');



  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');



  const [photos, setPhotos] = useState([]);

  const [photoError, setPhotoError] = useState('');



  const today = campusDate();



  // Загружаем только собственную одобренную заявку, не чужие данные.
  useEffect(() => {
    if (!isEditing) return;
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/applications/my`, {
      headers: { Authorization: `Bearer ${token}` }, signal: controller.signal
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Заявка не найдена');
      const found = data.find(a => a._id === applicationId && a.status === 'approved' && a.requestType !== 'update');
      if (!found) throw new Error('Одобренная заявка не найдена');
      const local = (value) => Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
        timeZone: CAMPUS_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(new Date(value)).map(part => [part.type, part.value]));
      const start = local(found.startAt), end = local(found.endAt);
      setForm({
        title: found.title, category: found.category, description: found.description,
        building: normalizeBuilding(found.venue?.building), venue: found.venue?._id || '',
        date: `${start.year}-${start.month}-${start.day}`,
        startTime: `${start.hour}:${start.minute}`, endTime: `${end.hour}:${end.minute}`,
        capacity: String(found.capacity), phone: found.phone, comment: found.comment || ''
      });
      setExistingImages(found.images || []);
    }).catch(error => {
      if (error.name !== 'AbortError') setError(error.message);
    }).finally(() => { if (!controller.signal.aborted) setEditingLoading(false); });
    return () => controller.abort();
  }, [applicationId, isEditing]);

  //pomesheniya is bd

  useEffect(() => {
    let cancelled = false;
    async function loadVenues() {
      try {
        const response = await fetch(

          `${API_URL}/venues`

        );

        const data = await response.json();

        if (!response.ok) {

          throw new Error(
            data.message || 'Ошибка загрузки помещений'
          );

        }
        if (!Array.isArray(data)) {

          throw new Error(
            'Некорректный ответ сервера'
          );

        }

        if (!cancelled) {

          setVenues(data);

        }

      } catch (err) {

        if (!cancelled) {

          setError(err.message);

        }

      } finally {

        if (!cancelled) {

          setLoadingVenues(false);

        }

      }

    }

    loadVenues();



    return () => {

      cancelled = true;

    };

  }, []);
  //proverka zanyatosti
  useEffect(() => {

    let cancelled = false;
    setOccupied([]);
    setAvailabilityError('');

    if (!form.venue || !form.date) {

      setLoadingAvailability(false);
      return;
    }

    setLoadingAvailability(true);

    async function loadAvailability() {

      try {

        const response = await fetch(
          `${API_URL}/venues/${encodeURIComponent(
            form.venue
          )}/availability?date=${encodeURIComponent(
            form.date
          )}`

        );

        const data = await response.json();

        if (!response.ok) {

          throw new Error(
            data.message ||
              'Не удалось проверить занятость помещения'
          );

        }



        if (!cancelled) {

          setOccupied(data.occupied || []);
        }

      } catch (err) {

        if (!cancelled) {

          setAvailabilityError(err.message);

        }
      } finally {

        if (!cancelled) {
          setLoadingAvailability(false);
        }
      }
    }

    loadAvailability();

    return () => {

      cancelled = true;

    };

  }, [form.venue, form.date]);

//korpusa i pomesheniya
  const buildings = [

    ...new Set(

      venues.map((venue) =>

        normalizeBuilding(venue.building)

      )

    ),

  ].sort();

  const filteredVenues = venues.filter(

    (venue) =>

      normalizeBuilding(venue.building) ===

      form.building

  );

  const selectedVenue = venues.find(

    (venue) => venue._id === form.venue

  );

//change polya formy

  function handleChange(event) {

    const { name, value } = event.target;

    setForm((previous) => {

      if (name === 'building') {

        return {

          ...previous,

          building: value,

          venue: '',

          capacity: '',

        };

      }

      if (name === 'venue') {

        return {

          ...previous,

          venue: value,

          capacity: '',

        };

      }

      return {

        ...previous,

        [name]: value,

      };

    });



    setError('');

  }

  //add photo
  function handlePhotos(event) {

    const selectedFiles = Array.from(

      event.target.files || []

    );

    const combined = [...photos, ...selectedFiles];

    if (combined.length > MAX_PHOTOS) {

      setPhotoError(

        `Можно загрузить максимум ${MAX_PHOTOS} фотографий.`

      );

      event.target.value = '';

      return;

    }

    const invalidType = combined.find(

      (file) =>

        !ALLOWED_PHOTO_TYPES.includes(file.type)

    );

    if (invalidType) {

      setPhotoError(

        'Разрешены только JPG, PNG и WebP.'

      );

      event.target.value = '';

      return;

    }



    const tooLarge = combined.find(

      (file) => file.size > MAX_PHOTO_SIZE

    );



    if (tooLarge) {

      setPhotoError(

        `Файл "${tooLarge.name}" больше 5 МБ.`

      );

      event.target.value = '';

      return;

    }

    setPhotos(combined);
    setPhotoError('');
    setError('');

    event.target.value = '';

  }

  function removePhoto(index) {

    setPhotos((previous) =>

      previous.filter((_, i) => i !== index)

    );

    setPhotoError('');

  }

//proverka vremeni esli zanyato
  function hasTimeConflict(start, end) {

    return occupied.some((item) => {

      const busyStart = new Date(item.startAt);

      const busyEnd = new Date(item.endAt);



      return (

        start < busyEnd &&

        end > busyStart

      );

    });

  }

  //send zayavku

  async function handleSubmit(event) {

    event.preventDefault();

    setError('');

    if (saving || editingLoading) {

      return;

    }
    const token = localStorage.getItem('token');

    if (!token) {

      navigate('/login', {

        state: {

          from: '/events/create',

        },

      });

      return;

    }

    const requiredFields = [

      'title',
      'category',
      'description',
      'building',
      'venue',
      'date',
      'startTime',
      'endTime',
      'capacity',
      'phone',
    ];
    if (
      requiredFields.some(

        (key) => !String(form[key]).trim()

      )

    ) {

      setError('Заполни все обязательные поля.');
      return;
    }

    if (!selectedVenue) {

      setError('Выбери помещение из списка.');
      return;
    }

    if (photoError) {

      setError(photoError);

      return;
    }
    const start = new Date(

      toCampusISO(

        form.date,

        form.startTime

      )

    );

    const end = new Date(

      toCampusISO(

        form.date,

        form.endTime

      )

    );

    if (

      Number.isNaN(start.getTime()) ||

      Number.isNaN(end.getTime())

    ) {
      setError(

        'Укажи корректную дату и время.'

      );
      return;

    }

    if (start <= new Date()) {

      setError(

        'Нельзя создавать мероприятие в прошлом.'

      );
      return;
    }
    if (end <= start) {

      setError(

        'Время окончания должно быть позже начала.'

      );
      return;

    }

    if (form.startTime < '07:00' || form.startTime > '19:00') {

      setError(

        'Мероприятие может начинаться только с 07:00 до 19:00.'

      );

      return;

    }

    if (form.endTime < '07:00' || form.endTime > '21:00') {

      setError(

        'Мероприятие должно заканчиваться с 07:00 до 21:00.'

      );
      return;

    }
    const capacity = Number(form.capacity);

    if (

      !Number.isInteger(capacity) ||

      capacity < 1 ||

      capacity > selectedVenue.capacity

    ) {

      setError(

        `Количество участников должно быть от 1 до ${selectedVenue.capacity}.`

      );
      return;
    }

    if (

      loadingAvailability ||

      availabilityError

    ) {

      setError(

        'Не удалось подтвердить доступность помещения. Попробуй ещё раз.'

      );
      return;

    }
    if (!isEditing && hasTimeConflict(start, end)) {

      setError(

        'Помещение уже занято в выбранное время. Выбери другой интервал.'

      );
      return;
    }
    //oтправляем обычные поля и фотографии вместе.

    const formData = new FormData();

    formData.append(

      'title',

      form.title.trim()

    );

    formData.append(

      'category',

      form.category

    );

    formData.append(

      'description',

      form.description.trim()

    );

    formData.append(

      'venue',

      form.venue

    );

    formData.append(

      'startAt',

      start.toISOString()

    );

    formData.append(

      'endAt',

      end.toISOString()

    );
    formData.append(

      'capacity',

      String(capacity)

    );
    formData.append(

      'phone',

      form.phone.trim()

    );
    formData.append(

      'comment',

      form.comment.trim()

    );
    //при редактировании старые фото сохраняются, если новые не загружены.
    photos.forEach((file) => {

      formData.append('images', file);

    });
    setSaving(true);
    try {

      const response = await fetch(

        isEditing ? `${API_URL}/applications/${applicationId}/request-update` : `${API_URL}/applications`,

        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));
      if (!response.ok) {

        throw new Error(

          data.message ||

            'Не удалось отправить заявку'

        );

      }
      navigate('/profile', {

        state: {

          success:
            isEditing ? 'Изменения отправлены администратору!' : 'Заявка успешно отправлена администратору!',
        },

      });

    } catch (err) {

      setError(

        err.message ||

          'Ошибка отправки заявки'
      );

    } finally {

      setSaving(false);

    }

  }
  //inteface
  return (

    <section className="create-event-page">

      <div className="create-event-container">

        {/* КНОПКА НАЗАД */}
        <button

          type="button"

          className="create-event-back"

          onClick={() => navigate(-1)}

        >
          <span>←</span>

          Назад

        </button>

        <div className="create-event-heading">

          <span className="eyebrow">

            ✦ CAMPUS LIFE

          </span>

          <h1>{isEditing ? 'Редактировать мероприятие' : 'Создать мероприятие'}</h1>
          <p>

            Расскажи о своём мероприятии и отправь

            заявку администрации колледжа.

          </p>

        </div>

        {editingLoading && <p>Загружаем данные заявки...</p>}
        {isEditing && existingImages.length > 0 && <p>Ранее загружено фотографий: {existingImages.length}. Без новых файлов они сохранятся.</p>}
        <form

          className="create-event-form"

          onSubmit={handleSubmit}

        >

          {/* ОСНОВНАЯ ИНФОРМАЦИЯ */}

          <div className="create-event-section">

            <h2>Основная информация</h2>

            <label htmlFor="event-title">

              Название мероприятия *

            </label>

            <input

              id="event-title"

              name="title"

              value={form.title}

              onChange={handleChange}

              placeholder="Например, IT Hackathon"

              required

            />

            <label htmlFor="event-category">

              Категория *

            </label>

            <select

              id="event-category"

              name="category"

              value={form.category}

              onChange={handleChange}

              required

            >

              <option value="">

                Выбери категорию

              </option>



              <option value="Образование">

                Образование

              </option>



              <option value="IT">

                IT и технологии

              </option>



              <option value="Спорт">

                Спорт

              </option>



              <option value="Творчество">

                Творчество

              </option>



              <option value="Развлечения">

                Развлечения

              </option>



              <option value="Другое">

                Другое

              </option>

            </select>



            <label htmlFor="event-description">

              Полное описание мероприятия *

            </label>



            <textarea

              id="event-description"

              name="description"

              value={form.description}

              onChange={handleChange}

              rows={6}

              placeholder="Опиши цель, программу, участников и особенности мероприятия..."

              required

            />

          </div>

          {/* МЕСТО И ВРЕМЯ */}

          <div className="create-event-section">

            <h2>Место и время</h2>

            <label htmlFor="event-building">

              Корпус *

            </label>

            <select

              id="event-building"

              name="building"

              value={form.building}

              onChange={handleChange}

              required

            >

              <option value="">

                Выбери корпус

              </option>



              <option value="C1.1">

                C1.1

              </option>



              <option value="C1.2">

                C1.2

              </option>



              <option value="C1.3">

                C1.3

              </option>

            </select>



            <label htmlFor="event-venue">

              Помещение *

            </label>

            <select

              id="event-venue"

              name="venue"

              value={form.venue}

              onChange={handleChange}

              disabled={

                !form.building ||

                loadingVenues

              }

              required

            >

              <option value="">

                {loadingVenues

                  ? 'Загрузка помещений...'

                  : 'Выбери помещение'}

              </option>

              {filteredVenues.map((venue) => (

                <option

                  key={venue._id}

                  value={venue._id}

                >

                  {venue.name} — до{' '}

                  {venue.capacity} человек

                </option>

              ))}

            </select>

            <div className="create-event-row">

              <div>

                <label htmlFor="event-date">

                  Дата *

                </label>

                <input

                  id="event-date"

                  type="date"

                  name="date"

                  min={today}

                  value={form.date}

                  onChange={handleChange}

                  required

                />

              </div>

              <div>

                <label htmlFor="event-capacity">

                  Количество мест *

                </label>

                <input

                  id="event-capacity"

                  type="number"

                  name="capacity"

                  min="1"

                  max={

                    selectedVenue?.capacity ||

                    undefined

                  }

                  step="1"

                  value={form.capacity}

                  onChange={handleChange}

                  placeholder={

                    selectedVenue

                      ? `Максимум ${selectedVenue.capacity}`

                      : 'Выбери помещение'

                  }

                  required

                />

              </div>

            </div>

            <div className="create-event-row">

              <div>

                <label htmlFor="event-start">

                  Время начала *

                </label>

                <input

                  id="event-start"

                  type="time"

                  name="startTime"
                  min="07:00"

                  max="19:00"

                  value={form.startTime}

                  onChange={handleChange}

                  required

                />

              </div>

              <div>

                <label htmlFor="event-end">

                  Время окончания *

                </label>

                <input

                  id="event-end"

                  type="time"

                  name="endTime"
                  min="07:00"

                  max="21:00"

                  value={form.endTime}

                  onChange={handleChange}

                  required

                />

              </div>

            </div>

            {/* ЗАНЯТОСТЬ ПОМЕЩЕНИЯ */}

            {form.venue && form.date && (

              <div className="create-event-hint">

                {loadingAvailability ? (

                  <p>

                    Проверяем занятость помещения...

                  </p>

                ) : availabilityError ? (

                  <p role="alert">

                    {availabilityError}

                  </p>

                ) : occupied.length === 0 ? (

                  <p>

                    На выбранную дату одобренных

                    бронирований нет.

                  </p>

                ) : (

                  <>

                    <p>

                      <strong>

                        Занятое время:

                      </strong>

                    </p>



                    {occupied.map((item, index) => (

                      <p key={index}>

                        {formatTime(item.startAt)}

                        {' — '}

                        {formatTime(item.endAt)}

                        {item.title

                          ? ` (${item.title})`

                          : ''}

                      </p>

                    ))}

                  </>

                )}

              </div>

            )}

          </div>

          {/* ФОТОГРАФИИ */}
          <div className="create-event-section">

            <h2>Фотографии мероприятия</h2>

            <p className="event-upload-description">

              Добавь до 6 фотографий.

              Первая фотография станет обложкой

              мероприятия, остальные будут

              показаны в галерее.

            </p>

            <div className="event-photo-upload">

              <input

                id="event-photos"

                className="event-photo-input"

                type="file"

                accept="image/jpeg,image/png,image/webp"

                multiple

                onChange={handlePhotos}

                disabled={

                  saving || editingLoading ||

                  photos.length >= MAX_PHOTOS

                }

              />

              <label

                htmlFor="event-photos"

                className={`event-photo-upload-btn ${

                  saving || photos.length >= MAX_PHOTOS

                    ? 'is-disabled'

                    : ''

                }`}

              >

                <span className="event-photo-upload-icon">

                  ＋

                </span>

                <span>

                  {photos.length >= MAX_PHOTOS

                    ? 'Достигнут лимит фотографий'

                    : 'Выбрать фотографии'}

                </span>

              </label>

            </div>
            <p className="event-upload-hint">

              JPG, PNG или WebP.

              До 5 МБ каждая.

              Выбрано: {photos.length} из 6.

            </p>
            {photoError && (

              <p

                className="create-event-message"

                role="alert"

              >

                {photoError}

              </p>

            )}

            {photos.length > 0 && (

              <div className="event-upload-preview">

                {photos.map((file, index) => (

                  <PhotoPreview

                    key={`${file.name}-${file.lastModified}-${index}`}

                    file={file}

                    index={index}

                    onRemove={() =>

                      removePhoto(index)

                    }

                  />

                ))}

              </div>

            )}

          </div>
          {/* КОНТАКТНАЯ ИНФОРМАЦИЯ */}

          <div className="create-event-section">

            <h2>Контактная информация</h2>

            <label htmlFor="event-phone">

              Контактный телефон *

            </label>

            <input

              id="event-phone"

              name="phone"

              type="tel"

              value={form.phone}

              onChange={handleChange}

              placeholder="+7 7XX XXX XX XX"

              required

            />

            <label htmlFor="event-comment">

              Дополнительный комментарий

            </label>

            <textarea

              id="event-comment"

              name="comment"

              value={form.comment}

              onChange={handleChange}

              rows={3}

              placeholder="Оборудование, пожелания, дополнительная информация..."

            />

          </div>

          {/* ОШИБКА */}

          {error && (

            <p

              className="create-event-message"

              role="alert"

            >

              {error}

            </p>

          )}

          {/* ОТПРАВКА */}

          <div className="create-event-footer">

            <p>

              После отправки заявка поступит

              администратору на рассмотрение.

            </p>

            <button

              type="submit"

              className="btn btn-primary"

              disabled={

                saving ||

                loadingVenues ||

                loadingAvailability ||

                Boolean(availabilityError) ||

                Boolean(photoError)

              }

            >

              {saving

                ? 'Отправка...'

                : isEditing ? 'Отправить изменения на проверку ↗' : 'Отправить заявку ↗'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
export default CreateEvent;
