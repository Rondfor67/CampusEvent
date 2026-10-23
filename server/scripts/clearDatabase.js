
import 'dotenv/config';
import mongoose from 'mongoose';

async function clearDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const db = mongoose.connection.db;

    const collections = [
    'registrations',
    'applications',
    'contacts',
    'events',
    'users',
    'allowed_students',
    ];

    console.log('База:', db.databaseName);

    if (db.databaseName !== 'campusevents') {
      throw new Error('Выбрана неправильная база данных!');
    }

    for (const name of collections) {
      const result = await db.collection(name).deleteMany({});
      console.log(`${name}: удалено ${result.deletedCount}`);
    }

    console.log('Очистка завершена!');
    console.log('allowed_students и venues сохранены.');
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

clearDatabase();
