import pool from "../config/database.config.js";

export const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE,
        name TEXT DEFAULT 'user',
        number TEXT UNIQUE,
        created TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS groups(
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,  
        owner INTEGER REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks(
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        created TIMESTAMP NOT NULL DEFAULT NOW(),
        owner INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'to-do', 
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        expire TIMESTAMP NOT NULL,
        items INTEGER[] DEFAULT '{}'
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS taskItems (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        status BOOLEAN DEFAULT FALSE,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS telegramSessions (
        id SERIAL PRIMARY KEY,
        session TEXT NOT NULL,
        phone TEXT NOT NULL,
        owner INTEGER REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("✅ Jadval muvaffaqiyatli yaratildi!");
  } catch (err) {
    console.error("❌ Xatolik:", err);
  }
};
