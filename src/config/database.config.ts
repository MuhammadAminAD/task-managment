import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 Database config tekshirilmoqda...');
console.log('📡 Host:', process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : 'not set');

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 20000, // 20 soniya
  idleTimeoutMillis: 30000,
  max: 10,
};

const pool = new Pool(poolConfig);

// Improved connection handler
async function connectDatabase() {
  console.log('🔄 Database ulanishi boshlanmoqda...');

  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL bilan ulanish muvaffaqiyatli!');

    // Test query
    const versionResult = await client.query('SELECT version()');
    console.log('📊 PostgreSQL:', versionResult.rows[0].version.split(',')[0]);

    const dbResult = await client.query('SELECT current_database() as db_name');
    console.log('🗄️  Database:', dbResult.rows[0].db_name);

    client.release();
    return true;

  } catch (error) {
    console.error('❌ Database ulanish xatosi:', error.message);

    // Detailed error analysis
    if (error.code === 'ENOTFOUND') {
      console.log('🔍 DNS xatosi - hostname topilmadi');
      console.log('💡 Maslahat: Public hostname ishlating');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🔍 Connection refused - port yoki host noto\'g\'ri');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('🔍 Connection timeout - tarmoq muammosi');
    }

    return false;
  }
}

// Application start
async function startApplication() {
  const dbConnected = await connectDatabase();

  if (!dbConnected) {
    console.log('⚠️  Database ulanmadi, lekin server ishlashda davom etadi');
    console.log('🔄 30 soniyadan keyin qayta urinish...');

    // Auto-retry after 30 seconds
    setTimeout(() => {
      connectDatabase();
    }, 30000);
  }

  // Server ni ishga tushirish (database ulanmasa ham)
  console.log('🚀 Server 8080-portda ishga tushmoqda...');
}

// Start the application
startApplication();

// Pool error handling
pool.on('error', (err) => {
  console.error('Database pool xatosi:', err);
});

export default pool;