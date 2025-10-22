import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

// const pool = new Pool({
//   host: process.env.PGHOST,
//   port: Number(process.env.PGPORT),
//   database: process.env.PGDATABASE,
//   user: process.env.PGUSER,
//   password: process.env.PGPASSWORD,
// });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(() => console.log("✅ PostgreSQL bilan ulanish o'rnatildi"))
  .catch(err => console.error("❌ Ulanishda xato:", err));

export default pool;