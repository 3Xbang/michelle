import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'villa_pms',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const ADMIN_USER = {
  name: 'admin',
  email: 'admin@villapms.com',
  password: 'admin123',
  role: 'Admin',
  preferred_lang: 'CN',
};

const ROOMS = [
  { name_cn: '清迈花园别墅A', name_en: 'Chiang Mai Garden Villa A', type: 'villa', rate: 3500 },
  { name_cn: '清迈花园别墅B', name_en: 'Chiang Mai Garden Villa B', type: 'villa', rate: 3200 },
  { name_cn: '清迈花园别墅C', name_en: 'Chiang Mai Garden Villa C', type: 'villa', rate: 3800 },
  { name_cn: '清迈山景别墅', name_en: 'Chiang Mai Mountain View Villa', type: 'villa', rate: 4500 },
  { name_cn: '清迈河畔别墅', name_en: 'Chiang Mai Riverside Villa', type: 'villa', rate: 5000 },
  { name_cn: '清迈古城民宿1号', name_en: 'Chiang Mai Old City Homestay 1', type: 'homestay', rate: 1200 },
  { name_cn: '清迈古城民宿2号', name_en: 'Chiang Mai Old City Homestay 2', type: 'homestay', rate: 1500 },
  { name_cn: '清迈宁曼路民宿', name_en: 'Chiang Mai Nimman Homestay', type: 'homestay', rate: 1800 },
  { name_cn: '普吉海景别墅A', name_en: 'Phuket Sea View Villa A', type: 'villa', rate: 6000 },
  { name_cn: '普吉海景别墅B', name_en: 'Phuket Sea View Villa B', type: 'villa', rate: 5500 },
  { name_cn: '普吉海滩别墅', name_en: 'Phuket Beach Villa', type: 'villa', rate: 7000 },
  { name_cn: '普吉镇民宿1号', name_en: 'Phuket Town Homestay 1', type: 'homestay', rate: 1600 },
  { name_cn: '普吉镇民宿2号', name_en: 'Phuket Town Homestay 2', type: 'homestay', rate: 1400 },
  { name_cn: '清迈公寓A', name_en: 'Chiang Mai Apartment A', type: 'apartment', rate: 2000 },
  { name_cn: '清迈公寓B', name_en: 'Chiang Mai Apartment B', type: 'apartment', rate: 2200 },
  { name_cn: '普吉公寓A', name_en: 'Phuket Apartment A', type: 'apartment', rate: 2500 },
  { name_cn: '普吉公寓B', name_en: 'Phuket Apartment B', type: 'apartment', rate: 2800 },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert default admin user
    const passwordHash = await bcrypt.hash(ADMIN_USER.password, 10);
    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role, preferred_lang)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [ADMIN_USER.name, ADMIN_USER.email, passwordHash, ADMIN_USER.role, ADMIN_USER.preferred_lang]
    );

    if (userResult.rows.length > 0) {
      console.log(`✓ Admin user created (id: ${userResult.rows[0].id})`);
    } else {
      console.log('⊘ Admin user already exists, skipped');
    }

    // Insert 17 rooms
    let inserted = 0;
    for (const room of ROOMS) {
      const result = await client.query(
        `INSERT INTO rooms (room_name_cn, room_name_en, room_type, base_daily_rate, status)
         VALUES ($1, $2, $3, $4, 'active')
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [room.name_cn, room.name_en, room.type, room.rate]
      );
      if (result.rows.length > 0) {
        inserted++;
      }
    }
    console.log(`✓ ${inserted} room(s) inserted (${ROOMS.length - inserted} already existed)`);

    await client.query('COMMIT');
    console.log('Seed completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
