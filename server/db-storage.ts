import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { users, companies, financialData, metricAlerts, type User, type InsertUser, type Company, type InsertCompany, type FinancialData, type InsertFinancialData, type MetricAlert, type InsertMetricAlert } from '@shared/schema';
import type { IStorage } from './storage';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getCompaniesByUserId(userId: string): Promise<Company[]> {
    return await db.select().from(companies).where(eq(companies.userId, userId));
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return result[0];
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const result = await db.insert(companies).values(insertCompany).returning();
    return result[0];
  }

  async getFinancialData(companyId: string, period?: string): Promise<FinancialData[]> {
    if (period) {
      return await db.select().from(financialData)
        .where(and(eq(financialData.companyId, companyId), eq(financialData.period, period)));
    }
    
    return await db.select().from(financialData)
      .where(eq(financialData.companyId, companyId))
      .orderBy(desc(financialData.createdAt));
  }

  async getFinancialDataByPeriod(companyId: string, period: string): Promise<FinancialData | undefined> {
    const result = await db.select().from(financialData)
      .where(and(eq(financialData.companyId, companyId), eq(financialData.period, period)))
      .limit(1);
    return result[0];
  }

  async createOrUpdateFinancialData(data: InsertFinancialData): Promise<FinancialData> {
    const result = await db.insert(financialData)
      .values(data)
      .onConflictDoUpdate({
        target: [financialData.companyId, financialData.period],
        set: { ...data, updatedAt: new Date() }
      })
      .returning();
    return result[0];
  }

  async getFinancialDataRange(companyId: string, startPeriod: string, endPeriod: string): Promise<FinancialData[]> {
    return await db.select().from(financialData)
      .where(
        and(
          eq(financialData.companyId, companyId),
          gte(financialData.period, startPeriod),
          lte(financialData.period, endPeriod)
        )
      )
      .orderBy(financialData.period);
  }

  async getMetricAlerts(companyId: string): Promise<MetricAlert[]> {
    return await db.select().from(metricAlerts)
      .where(eq(metricAlerts.companyId, companyId));
  }

  async getMetricAlert(id: string): Promise<MetricAlert | undefined> {
    const result = await db.select().from(metricAlerts)
      .where(eq(metricAlerts.id, id))
      .limit(1);
    return result[0];
  }

  async createOrUpdateMetricAlert(alert: InsertMetricAlert): Promise<MetricAlert> {
    const result = await db.insert(metricAlerts)
      .values(alert)
      .onConflictDoUpdate({
        target: [metricAlerts.companyId, metricAlerts.metricName],
        set: { ...alert, updatedAt: new Date() }
      })
      .returning();
    return result[0];
  }

  async deleteMetricAlert(id: string): Promise<void> {
    await db.delete(metricAlerts).where(eq(metricAlerts.id, id));
  }
}
