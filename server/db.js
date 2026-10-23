import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

// Подключение к PostgreSQL (настроено через переменные среды или стандартный локальный адрес)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/campusevent'
  // Замени "postgres:password" на свой логин/пароль от локальной базы PostgreSQL, если они отличаются
});

export default pool;