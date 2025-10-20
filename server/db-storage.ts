/**
 * ============================================================================
 * DATABASE STORAGE LAYER
 * ============================================================================
 * 
 * PostgreSQL database implementation using Drizzle ORM and Neon serverless.
 * Implements the IStorage interface for data persistence operations.
 * 
 * Database Provider: Neon Serverless PostgreSQL
 * ORM: Drizzle ORM with connection pooling
 * WebSocket Support: Configured for Neon's serverless architecture
 * 
 * Features:
 * - User and company management
 * - Financial data CRUD with upsert patterns
 * - Metric alerts system
 * - Period-based queries and range filtering
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { 
  users, 
  companies, 
  financialData, 
  metricAlerts,
  sessions,
  companyUsers,
  type User, 
  type InsertUser, 
  type Company, 
  type InsertCompany, 
  type FinancialData, 
  type InsertFinancialData, 
  type MetricAlert, 
  type InsertMetricAlert,
  type Session,
  type InsertSession,
  type CompanyUser,
  type InsertCompanyUser
} from '@shared/schema';
import type { IStorage } from './storage';
import ws from 'ws';

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

// Configure Neon to use WebSocket for serverless connections
neonConfig.webSocketConstructor = ws;

// Create connection pool using DATABASE_URL environment variable
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Initialize Drizzle ORM with the connection pool
const db = drizzle(pool);

// ============================================================================
// DATABASE STORAGE CLASS
// ============================================================================

/**
 * Database Storage Implementation
 * 
 * Concrete implementation of the IStorage interface using PostgreSQL.
 * All methods use Drizzle ORM for type-safe database operations.
 * 
 * @class DbStorage
 * @implements {IStorage}
 */
export class DbStorage implements IStorage {
  
  // ==========================================================================
  // USER METHODS
  // ==========================================================================

  /**
   * Get user by ID
   * 
   * @param {string} id - User's unique identifier
   * @returns {Promise<User | undefined>} User object or undefined if not found
   */
  async getUser(id: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  /**
   * Get user by username (email)
   * 
   * Used for authentication and demo user lookup.
   * 
   * @param {string} username - User's username/email
   * @returns {Promise<User | undefined>} User object or undefined if not found
   */
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return result[0];
  }

  /**
   * Create a new user
   * 
   * @param {InsertUser} insertUser - User data to insert
   * @returns {Promise<User>} Created user object with generated ID
   */
  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return result[0];
  }

  // ==========================================================================
  // COMPANY METHODS
  // ==========================================================================

  /**
   * Get all companies belonging to a user
   * 
   * @param {string} userId - User's unique identifier
   * @returns {Promise<Company[]>} Array of company objects
   */
  async getCompaniesByUserId(userId: string): Promise<Company[]> {
    return await db
      .select()
      .from(companies)
      .where(eq(companies.userId, userId));
  }

  /**
   * Get company by ID
   * 
   * @param {string} id - Company's unique identifier
   * @returns {Promise<Company | undefined>} Company object or undefined if not found
   */
  async getCompany(id: string): Promise<Company | undefined> {
    const result = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id))
      .limit(1);
    return result[0];
  }

  /**
   * Create a new company
   * 
   * @param {InsertCompany} insertCompany - Company data to insert
   * @returns {Promise<Company>} Created company object with generated ID
   */
  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const result = await db
      .insert(companies)
      .values(insertCompany)
      .returning();
    return result[0];
  }

  // ==========================================================================
  // FINANCIAL DATA METHODS
  // ==========================================================================

  /**
   * Get financial data for a company
   * 
   * Retrieves all financial data or filters by period if provided.
   * Results are ordered by creation date (newest first).
   * 
   * @param {string} companyId - Company's unique identifier
   * @param {string} [period] - Optional period filter (e.g., "2024", "2024-Q1")
   * @returns {Promise<FinancialData[]>} Array of financial data entries
   */
  async getFinancialData(companyId: string, period?: string): Promise<FinancialData[]> {
    // If period is specified, filter by both company and period
    if (period) {
      return await db
        .select()
        .from(financialData)
        .where(
          and(
            eq(financialData.companyId, companyId), 
            eq(financialData.period, period)
          )
        );
    }
    
    // Otherwise, return all data for the company, sorted by creation date
    return await db
      .select()
      .from(financialData)
      .where(eq(financialData.companyId, companyId))
      .orderBy(desc(financialData.createdAt));
  }

  /**
   * Get financial data for a specific period
   * 
   * Returns a single entry matching the company and period.
   * Used for metric calculations and period comparisons.
   * 
   * @param {string} companyId - Company's unique identifier
   * @param {string} period - Period identifier (e.g., "2024", "2024-Q1")
   * @returns {Promise<FinancialData | undefined>} Financial data or undefined if not found
   */
  async getFinancialDataByPeriod(companyId: string, period: string): Promise<FinancialData | undefined> {
    const result = await db
      .select()
      .from(financialData)
      .where(
        and(
          eq(financialData.companyId, companyId), 
          eq(financialData.period, period)
        )
      )
      .limit(1);
    return result[0];
  }

  /**
   * Create or update financial data (upsert operation)
   * 
   * Uses PostgreSQL's ON CONFLICT clause to handle duplicate entries.
   * Unique constraint: (companyId, period)
   * 
   * If a record exists for the same company and period:
   * - Updates all fields with new values
   * - Sets updatedAt to current timestamp
   * 
   * Otherwise:
   * - Creates a new record
   * 
   * @param {InsertFinancialData} data - Financial data to insert or update
   * @returns {Promise<FinancialData>} Created or updated financial data entry
   */
  async createOrUpdateFinancialData(data: InsertFinancialData): Promise<FinancialData> {
    const result = await db
      .insert(financialData)
      .values(data)
      .onConflictDoUpdate({
        target: [financialData.companyId, financialData.period],
        set: { ...data, updatedAt: new Date() }
      })
      .returning();
    return result[0];
  }

  /**
   * Get financial data within a period range
   * 
   * Useful for multi-period analysis and trend charts.
   * Returns data sorted by period in ascending order.
   * 
   * @param {string} companyId - Company's unique identifier
   * @param {string} startPeriod - Start period (inclusive, e.g., "2022")
   * @param {string} endPeriod - End period (inclusive, e.g., "2024")
   * @returns {Promise<FinancialData[]>} Array of financial data within the range
   * 
   * @example
   * // Get all data from 2022 to 2024
   * const data = await getFinancialDataRange(companyId, "2022", "2024");
   */
  async getFinancialDataRange(
    companyId: string, 
    startPeriod: string, 
    endPeriod: string
  ): Promise<FinancialData[]> {
    return await db
      .select()
      .from(financialData)
      .where(
        and(
          eq(financialData.companyId, companyId),
          gte(financialData.period, startPeriod),
          lte(financialData.period, endPeriod)
        )
      )
      .orderBy(financialData.period);
  }

  // ==========================================================================
  // METRIC ALERTS METHODS
  // ==========================================================================

  /**
   * Get all metric alerts for a company
   * 
   * @param {string} companyId - Company's unique identifier
   * @returns {Promise<MetricAlert[]>} Array of metric alert configurations
   */
  async getMetricAlerts(companyId: string): Promise<MetricAlert[]> {
    return await db
      .select()
      .from(metricAlerts)
      .where(eq(metricAlerts.companyId, companyId));
  }

  /**
   * Get a specific metric alert by ID
   * 
   * @param {string} id - Alert's unique identifier
   * @returns {Promise<MetricAlert | undefined>} Metric alert or undefined if not found
   */
  async getMetricAlert(id: string): Promise<MetricAlert | undefined> {
    const result = await db
      .select()
      .from(metricAlerts)
      .where(eq(metricAlerts.id, id))
      .limit(1);
    return result[0];
  }

  /**
   * Create or update a metric alert (upsert operation)
   * 
   * Uses PostgreSQL's ON CONFLICT clause to handle duplicate alerts.
   * Unique constraint: (companyId, metricName)
   * 
   * This ensures only one alert exists per metric per company.
   * If an alert already exists for the same metric:
   * - Updates threshold, condition, and enabled status
   * - Sets updatedAt to current timestamp
   * 
   * @param {InsertMetricAlert} alert - Alert configuration to insert or update
   * @returns {Promise<MetricAlert>} Created or updated metric alert
   * 
   * @example
   * // Create or update an alert for Current Ratio
   * const alert = await createOrUpdateMetricAlert({
   *   companyId: "company-123",
   *   metricName: "currentRatio",
   *   threshold: 1.5,
   *   condition: "below",
   *   enabled: true
   * });
   */
  async createOrUpdateMetricAlert(alert: InsertMetricAlert): Promise<MetricAlert> {
    const result = await db
      .insert(metricAlerts)
      .values(alert)
      .onConflictDoUpdate({
        target: [metricAlerts.companyId, metricAlerts.metricName],
        set: { ...alert, updatedAt: new Date() }
      })
      .returning();
    return result[0];
  }

  /**
   * Delete a metric alert
   * 
   * Permanently removes an alert configuration.
   * 
   * @param {string} id - Alert's unique identifier
   * @returns {Promise<void>}
   */
  async deleteMetricAlert(id: string): Promise<void> {
    await db
      .delete(metricAlerts)
      .where(eq(metricAlerts.id, id));
  }

  // ==========================================================================
  // SESSION MANAGEMENT METHODS
  // ==========================================================================

  async getSession(id: string): Promise<Session | undefined> {
    const result = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);
    
    const session = result[0];
    
    // Check if session is expired
    if (session && new Date(session.expiresAt) < new Date()) {
      await this.deleteSession(id);
      return undefined;
    }
    
    return session;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const result = await db
      .insert(sessions)
      .values(insertSession)
      .returning();
    return result[0];
  }

  async updateSessionActivity(id: string): Promise<Session | undefined> {
    const result = await db
      .update(sessions)
      .set({ lastActive: new Date() })
      .where(eq(sessions.id, id))
      .returning();
    return result[0];
  }

  async deleteSession(id: string): Promise<boolean> {
    await db
      .delete(sessions)
      .where(eq(sessions.id, id));
    return true;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    const result = await db
      .delete(sessions)
      .where(lte(sessions.expiresAt, now))
      .returning();
    return result.length;
  }

  // ==========================================================================
  // USER UPDATE METHODS
  // ==========================================================================

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async verifyUserEmail(id: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  // ==========================================================================
  // COMPANY UPDATE METHODS
  // ==========================================================================

  async updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company | undefined> {
    const result = await db
      .update(companies)
      .set(updates)
      .where(eq(companies.id, id))
      .returning();
    return result[0];
  }

  // ==========================================================================
  // COMPANY USER METHODS
  // ==========================================================================

  async getCompanyUser(userId: string, companyId: string): Promise<CompanyUser | undefined> {
    const result = await db
      .select()
      .from(companyUsers)
      .where(and(
        eq(companyUsers.userId, userId),
        eq(companyUsers.companyId, companyId)
      ))
      .limit(1);
    return result[0];
  }

  async createCompanyUser(insertCompanyUser: InsertCompanyUser): Promise<CompanyUser> {
    const result = await db
      .insert(companyUsers)
      .values(insertCompanyUser)
      .returning();
    return result[0];
  }

  async updateCompanyUser(id: string, updates: Partial<InsertCompanyUser>): Promise<CompanyUser | undefined> {
    const result = await db
      .update(companyUsers)
      .set(updates)
      .where(eq(companyUsers.id, id))
      .returning();
    return result[0];
  }

  async removeCompanyUser(id: string): Promise<boolean> {
    await db
      .delete(companyUsers)
      .where(eq(companyUsers.id, id));
    return true;
  }
}
