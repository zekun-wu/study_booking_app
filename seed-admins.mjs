import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { admins } from './drizzle/schema.js';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

async function seedAdmins() {
  console.log('Seeding admin accounts...');

  const adminAccounts = [
    {
      email: 'iwm@admin.com',
      password: 'Admin2024!',
      name: 'IWM Admin',
      location: 'IWM',
    },
    {
      email: 'saarland@admin.com',
      password: 'Admin2024!',
      name: 'Saarland Admin',
      location: 'Saarland',
    },
  ];

  for (const admin of adminAccounts) {
    const hashedPassword = await bcrypt.hash(admin.password, 10);
    
    try {
      await db.insert(admins).values({
        email: admin.email,
        password: hashedPassword,
        name: admin.name,
        location: admin.location,
      });
      console.log(`✓ Created admin: ${admin.email}`);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`⚠ Admin already exists: ${admin.email}`);
      } else {
        console.error(`✗ Failed to create admin ${admin.email}:`, error);
      }
    }
  }

  console.log('Admin seeding complete!');
  await connection.end();
  process.exit(0);
}

seedAdmins().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
