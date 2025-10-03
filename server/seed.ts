import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { users, companies, financialData } from '@shared/schema';
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

  const [user] = await db.insert(users).values({
    username: 'demo@company.com',
    password: 'password123',
  }).returning();

  console.log('Created demo user:', user.username);

  const [company] = await db.insert(companies).values({
    name: 'Demo Company',
    userId: user.id,
  }).returning();

  console.log('Created demo company:', company.name);

  await db.insert(financialData).values([
    {
      companyId: company.id,
      period: '2024',
      periodType: 'yearly',
      totalRevenue: '2847500.00',
      grossProfit: '1210187.50',
      netIncome: '521092.50',
      operatingIncome: '575000.00',
      costOfGoodsSold: '1637312.50',
      operatingExpenses: '635187.50',
      totalAssets: '4100000.00',
      currentAssets: '1250000.00',
      inventory: '180000.00',
      accountsReceivable: '328000.00',
      totalLiabilities: '2980000.00',
      currentLiabilities: '595000.00',
      accountsPayable: '230000.00',
      totalEquity: '2120000.00',
      operatingCashFlow: '425800.00',
      investingCashFlow: '-150000.00',
      financingCashFlow: '-80000.00',
      marketingSpend: '145000.00',
      newCustomers: 508,
      totalCustomers: 2850,
    },
    {
      companyId: company.id,
      period: '2023',
      periodType: 'yearly',
      totalRevenue: '2531250.00',
      grossProfit: '1030406.25',
      netIncome: '412062.50',
      operatingIncome: '485000.00',
      costOfGoodsSold: '1500843.75',
      operatingExpenses: '545406.25',
      totalAssets: '3800000.00',
      currentAssets: '1100000.00',
      inventory: '165000.00',
      accountsReceivable: '295000.00',
      totalLiabilities: '2650000.00',
      currentLiabilities: '578947.37',
      accountsPayable: '215000.00',
      totalEquity: '1850000.00',
      operatingCashFlow: '392000.00',
      investingCashFlow: '-125000.00',
      financingCashFlow: '-70000.00',
      marketingSpend: '135000.00',
      newCustomers: 430,
      totalCustomers: 2342,
    },
    {
      companyId: company.id,
      period: '2024-Q4',
      periodType: 'quarterly',
      totalRevenue: '785000.00',
      grossProfit: '330125.00',
      netIncome: '143000.00',
      operatingIncome: '157500.00',
      costOfGoodsSold: '454875.00',
      operatingExpenses: '172625.00',
      totalAssets: '4100000.00',
      currentAssets: '1250000.00',
      inventory: '180000.00',
      accountsReceivable: '328000.00',
      totalLiabilities: '2980000.00',
      currentLiabilities: '595000.00',
      accountsPayable: '230000.00',
      totalEquity: '2120000.00',
      operatingCashFlow: '116950.00',
      investingCashFlow: '-40000.00',
      financingCashFlow: '-20000.00',
      marketingSpend: '37500.00',
      newCustomers: 135,
      totalCustomers: 2850,
    },
    {
      companyId: company.id,
      period: '2024-Q3',
      periodType: 'quarterly',
      totalRevenue: '720000.00',
      grossProfit: '302400.00',
      netIncome: '131400.00',
      operatingIncome: '144000.00',
      costOfGoodsSold: '417600.00',
      operatingExpenses: '158400.00',
      totalAssets: '4050000.00',
      currentAssets: '1220000.00',
      inventory: '175000.00',
      accountsReceivable: '315000.00',
      totalLiabilities: '2950000.00',
      currentLiabilities: '590000.00',
      accountsPayable: '225000.00',
      totalEquity: '2100000.00',
      operatingCashFlow: '107640.00',
      investingCashFlow: '-38000.00',
      financingCashFlow: '-18000.00',
      marketingSpend: '36000.00',
      newCustomers: 128,
      totalCustomers: 2715,
    },
  ]);

  console.log('Seeded financial data for multiple periods');
  console.log('Seed complete!');
  
  await pool.end();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
