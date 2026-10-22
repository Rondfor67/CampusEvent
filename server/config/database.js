import mongoose from 'mongoose';

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Atlas подключена!');
  } catch (error) {
    console.error('Ошибка MongoDB:', error.message);
    process.exit(1);
  }
}