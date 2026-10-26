import mongoose from 'mongoose';

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log('MongoDB Atlas подключена!');
  } catch (error) {
    console.error('Ошибка MongoDB:', error.message);

    if (error.reason?.servers) {
      for (const [address, server] of error.reason.servers) {
        console.error(`Сервер MongoDB: ${address}`);
        console.error('Состояние:', server.type);
        console.error('Причина:', server.error?.message || 'Не указана');
        console.error('Код:', server.error?.code || 'Не указан');
      }
    }

    process.exit(1);
  }
}