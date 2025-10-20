import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { users, companies, financialData } from '@shared/schema';
import bcrypt from 'bcrypt';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  console.log('Seeding database...');

  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  // Hash password for secure storage (bcrypt with 12 salt rounds)
  const hashedPassword = await bcrypt.hash('demo123', 12);

  const [user] = await db.insert(users).values({
    username: 'demo',
    email: 'demo@company.com',
    password: hashedPassword,
  }).returning();

  console.log('Created demo user:', user.username);

  const [company] = await db.insert(companies).values({
    name: 'Demo Company',
    userId: user.id,
  }).returning();

  console.log('Created demo company:', company.name);
  console.log('');
  console.log('✅ Seed complete! No financial data added - use the form to add your own data.');
  console.log('');
  console.log('📌 Demo Login Credentials:');
  console.log('   Username: demo');
  console.log('   Password: demo123');
  console.log('');
  
  await pool.end();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
