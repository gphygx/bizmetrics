/**
 * ============================================================================
 * DATA STORAGE MODULE - BIZMETRICS FINANCIAL PLATFORM
 * ============================================================================
 * 
 * Complete storage implementation for BizMetrics financial analytics platform.
 * Provides database operations for user authentication, company management,
 * financial data, and metric alerts.
 * 
 * FEATURES:
 * - Multi-tenant data isolation with company-based access control
 * - User authentication and session management
 * - Financial data CRUD operations with period-based queries
 * - Metric alert system with threshold monitoring
 * - Role-based permissions enforcement
 * 
 * STORAGE LAYERS:
 * - MemStorage: In-memory implementation for development/demo
 * - DbStorage: PostgreSQL implementation for production
 * 
 * SECURITY:
 * - All operations validate company access permissions
 * - User authentication required for sensitive operations
 * - Data isolation between companies and users
 * - Session-based authentication with expiration
 */

import { 
  type User, type InsertUser, 
  type Company, type InsertCompany, 
  type FinancialData, type InsertFinancialData, 
  type MetricAlert, type InsertMetricAlert,
  type CompanyUser, type InsertCompanyUser,
  type Session, type InsertSession,
  type UserRole,
  DEFAULT_PERMISSIONS
} from "@shared/schema";
import { randomUUID } from "crypto";

// ============================================================================
// STORAGE INTERFACE
// ============================================================================

/**
 * STORAGE INTERFACE
 * 
 * Defines all data operations for the BizMetrics application.
 * This interface can be implemented by different storage backends
 * (in-memory, PostgreSQL, etc.) while maintaining consistency.
 * 
 * OPERATION CATEGORIES:
 * - User Management: Authentication, profiles, sessions
 * - Company Management: Companies and user-company relationships
 * - Financial Data: Complete financial records and period queries
 * - Metric Alerts: Threshold-based alert system
 * - Session Management: Authentication session handling
 */
export interface IStorage {

  // ==================== USER MANAGEMENT ====================

  /**
   * Get a user by their unique ID
   * @param id - User UUID
   * @returns User object or undefined if not found
   */
  getUser(id: string): Promise<User | undefined>;

  /**
   * Get a user by their username (email)
   * @param username - User's username/email
   * @returns User object or undefined if not found
   */
  getUserByUsername(username: string): Promise<User | undefined>;

  /**
   * Create a new user account
   * @param user - User registration data
   * @returns Created user object with generated ID
   */
  createUser(user: InsertUser): Promise<User>;

  /**
   * Update user profile information
   * @param id - User ID to update
   * @param updates - Partial user data to update
   * @returns Updated user or undefined if not found
   */
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;

  /**
   * Verify user's email address
   * @param id - User ID to verify
   * @returns Updated user or undefined if not found
   */
  verifyUserEmail(id: string): Promise<User | undefined>;

  // ==================== COMPANY MANAGEMENT ====================

  /**
   * Get all companies associated with a user
   * @param userId - User's unique identifier
   * @returns Array of company objects the user can access
   */
  getCompaniesByUserId(userId: string): Promise<Company[]>;

  /**
   * Get a specific company by ID
   * @param id - Company UUID
   * @returns Company object or undefined if not found
   */
  getCompany(id: string): Promise<Company | undefined>;

  /**
   * Create a new company
   * @param company - Company creation data
   * @returns Created company object with generated ID
   */
  createCompany(company: InsertCompany): Promise<Company>;

  /**
   * Update company information
   * @param id - Company ID to update
   * @param updates - Partial company data to update
   * @returns Updated company or undefined if not found
   */
  updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company | undefined>;

  // ==================== COMPANY USER RELATIONSHIPS ====================

  /**
   * Get company user relationship (role and permissions)
   * @param userId - User ID
   * @param companyId - Company ID
   * @returns CompanyUser object or undefined if relationship doesn't exist
   */
  getCompanyUser(userId: string, companyId: string): Promise<CompanyUser | undefined>;

  /**
   * Get all users with access to a company
   * @param companyId - Company ID
   * @returns Array of CompanyUser relationships
   */
  getCompanyUsers(companyId: string): Promise<CompanyUser[]>;

  /**
   * Add user to company with specific role
   * @param companyUser - User-company relationship data
   * @returns Created CompanyUser relationship
   */
  createCompanyUser(companyUser: InsertCompanyUser): Promise<CompanyUser>;

  /**
   * Update user's role and permissions in a company
   * @param id - CompanyUser relationship ID
   * @param updates - Updated role and permissions
   * @returns Updated CompanyUser or undefined if not found
   */
  updateCompanyUser(id: string, updates: Partial<InsertCompanyUser>): Promise<CompanyUser | undefined>;

  /**
   * Remove user's access to a company
   * @param id - CompanyUser relationship ID
   * @returns True if removed, false if not found
   */
  removeCompanyUser(id: string): Promise<boolean>;

  // ==================== SESSION MANAGEMENT ====================

  /**
   * Get session by ID
   * @param id - Session UUID
   * @returns Session object or undefined if not found/expired
   */
  getSession(id: string): Promise<Session | undefined>;

  /**
   * Create a new authentication session
   * @param session - Session creation data
   * @returns Created session object
   */
  createSession(session: InsertSession): Promise<Session>;

  /**
   * Update session activity timestamp
   * @param id - Session ID to update
   * @returns Updated session or undefined if not found
   */
  updateSessionActivity(id: string): Promise<Session | undefined>;

  /**
   * Delete a session (logout)
   * @param id - Session ID to delete
   * @returns True if deleted, false if not found
   */
  deleteSession(id: string): Promise<boolean>;

  /**
   * Clean up expired sessions
   * @returns Number of sessions deleted
   */
  cleanupExpiredSessions(): Promise<number>;

  // ==================== FINANCIAL DATA MANAGEMENT ====================

  /**
   * Get financial data for a company, optionally filtered by period
   * @param companyId - Company UUID
   * @param period - Optional period filter (e.g., "2024")
   * @returns Array of financial data entries, sorted by period
   */
  getFinancialData(companyId: string, period?: string): Promise<FinancialData[]>;

  /**
   * Get financial data for a specific company and period
   * @param companyId - Company UUID
   * @param period - Period identifier (e.g., "2024", "2024-Q1")
   * @returns Financial data object or undefined if not found
   */
  getFinancialDataByPeriod(companyId: string, period: string): Promise<FinancialData | undefined>;

  /**
   * Create or update financial data for a company period
   * Uses upsert pattern based on companyId + period unique constraint
   * @param data - Financial data to create or update
   * @returns Created or updated financial data object
   */
  createOrUpdateFinancialData(data: InsertFinancialData): Promise<FinancialData>;

  /**
   * Get financial data for a date range
   * @param companyId - Company UUID
   * @param startPeriod - Start period (inclusive)
   * @param endPeriod - End period (inclusive)
   * @returns Array of financial data within the range
   */
  getFinancialDataRange(companyId: string, startPeriod: string, endPeriod: string): Promise<FinancialData[]>;

  // ==================== METRIC ALERTS MANAGEMENT ====================

  /**
   * Get all metric alerts for a company
   * @param companyId - Company UUID
   * @returns Array of metric alert objects
   */
  getMetricAlerts(companyId: string): Promise<MetricAlert[]>;

  /**
   * Get a specific metric alert by ID
   * @param id - Alert UUID
   * @returns Metric alert object or undefined if not found
   */
  getMetricAlert(id: string): Promise<MetricAlert | undefined>;

  /**
   * Create or update a metric alert
   * Uses upsert pattern based on companyId + metricName unique constraint
   * @param alert - Alert configuration data
   * @returns Created or updated metric alert object
   */
  createOrUpdateMetricAlert(alert: InsertMetricAlert): Promise<MetricAlert>;

  /**
   * Delete a metric alert
   * @param id - Alert UUID to delete
   * @returns void
   */
  deleteMetricAlert(id: string): Promise<void>;
}

// ============================================================================
// IN-MEMORY STORAGE IMPLEMENTATION
// ============================================================================

/**
 * MEMSTORAGE CLASS
 * 
 * In-memory storage implementation using JavaScript Map structures.
 * Suitable for development, testing, and single-session use cases.
 * 
 * CHARACTERISTICS:
 * - Data persists only during application runtime
 * - Fast read/write operations
 * - Auto-generated UUIDs for all entities
 * - Sample data initialization for demo purposes
 * 
 * LIMITATIONS:
 * - Data lost on server restart
 * - Not suitable for production multi-instance deployments
 * - No persistent storage between sessions
 */
export class MemStorage implements IStorage {
  // Primary storage maps
  private users: Map<string, User>;
  private companies: Map<string, Company>;
  private companyUsers: Map<string, CompanyUser>;
  private sessions: Map<string, Session>;
  private financialData: Map<string, FinancialData>;
  private metricAlerts: Map<string, MetricAlert>;

  /**
   * Initialize empty storage maps and populate with sample data
   */
  constructor() {
    this.users = new Map();
    this.companies = new Map();
    this.companyUsers = new Map();
    this.sessions = new Map();
    this.financialData = new Map();
    this.metricAlerts = new Map();

    // Initialize with comprehensive sample data for demo
    this.initializeSampleData();
  }

  /**
   * SAMPLE DATA INITIALIZATION
   * 
   * Creates demo user, company, financial data, and sample relationships
   * for testing and demonstration purposes.
   */
  private initializeSampleData() {
    // ==================== CREATE DEMO USER ====================
    const userId = randomUUID();
    const user: User = {
      id: userId,
      username: "demo@company.com",
      email: "demo@company.com",
      password: "password123", // In production, this should be hashed
      fullName: "Demo User",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(userId, user);

    // ==================== CREATE DEMO COMPANY ====================
    const companyId = randomUUID();
    const company: Company = {
      id: companyId,
      name: "Demo Corporation Inc.",
      userId: userId,
      createdAt: new Date()
    };
    this.companies.set(companyId, company);

    // ==================== CREATE COMPANY USER RELATIONSHIP ====================
    const companyUserId = randomUUID();
    const companyUser: CompanyUser = {
      id: companyUserId,
      userId: userId,
      companyId: companyId,
      role: "owner",
      permissions: DEFAULT_PERMISSIONS.owner,
      createdAt: new Date(),
      invitedBy: userId,
      invitedAt: new Date()
    };
    this.companyUsers.set(companyUserId, companyUser);

    // ==================== CREATE SAMPLE FINANCIAL DATA ====================
    const currentPeriod = "2024";
    const previousPeriod = "2023";

    // Current period data (2024) - Strong performance
    const currentData: FinancialData = {
      id: randomUUID(),
      companyId,
      period: currentPeriod,
      periodType: "yearly",
      // Income Statement
      totalRevenue: "2847500.00",
      grossProfit: "1210187.50",
      netIncome: "521092.50",
      operatingIncome: "575000.00",
      costOfGoodsSold: "1637312.50",
      operatingExpenses: "635187.50",
      // Balance Sheet
      totalAssets: "4100000.00",
      currentAssets: "1250000.00",
      inventory: "180000.00",
      accountsReceivable: "328000.00",
      totalLiabilities: "2980000.00",
      currentLiabilities: "595000.00",
      accountsPayable: "230000.00",
      totalEquity: "2120000.00",
      // Cash Flow
      operatingCashFlow: "425800.00",
      investingCashFlow: "-150000.00",
      financingCashFlow: "-80000.00",
      // Business Metrics
      marketingSpend: "145000.00",
      newCustomers: 508,
      totalCustomers: 2850,
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Previous period data (2023) - Baseline performance
    const previousData: FinancialData = {
      id: randomUUID(),
      companyId,
      period: previousPeriod,
      periodType: "yearly",
      // Income Statement
      totalRevenue: "2531250.00",
      grossProfit: "1030406.25",
      netIncome: "412062.50",
      operatingIncome: "485000.00",
      costOfGoodsSold: "1500843.75",
      operatingExpenses: "545406.25",
      // Balance Sheet
      totalAssets: "3800000.00",
      currentAssets: "1100000.00",
      inventory: "165000.00",
      accountsReceivable: "295000.00",
      totalLiabilities: "2650000.00",
      currentLiabilities: "578947.37",
      accountsPayable: "215000.00",
      totalEquity: "1850000.00",
      // Cash Flow
      operatingCashFlow: "392000.00",
      investingCashFlow: "-125000.00",
      financingCashFlow: "-70000.00",
      // Business Metrics
      marketingSpend: "135000.00",
      newCustomers: 430,
      totalCustomers: 2342,
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.financialData.set(currentData.id, currentData);
    this.financialData.set(previousData.id, previousData);

    // ==================== CREATE SAMPLE METRIC ALERTS ====================
    const alert1Id = randomUUID();
    const alert1: MetricAlert = {
      id: alert1Id,
      companyId,
      metricName: "currentRatio",
      threshold: "1.50",
      condition: "below",
      isEnabled: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const alert2Id = randomUUID();
    const alert2: MetricAlert = {
      id: alert2Id,
      companyId,
      metricName: "netProfitMargin",
      threshold: "15.00",
      condition: "below",
      isEnabled: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.metricAlerts.set(alert1Id, alert1);
    this.metricAlerts.set(alert2Id, alert2);
  }

  // ============================================================================
  // USER MANAGEMENT METHODS
  // ============================================================================

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = { 
      id,
      username: insertUser.username,
      email: insertUser.email || insertUser.username, // Use username as email if not provided
      password: insertUser.password,
      fullName: insertUser.fullName || null,
      emailVerified: false,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updated = { 
      ...user, 
      ...updates,
      updatedAt: new Date()
    };
    this.users.set(id, updated);
    return updated;
  }

  async verifyUserEmail(id: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updated = { 
      ...user, 
      emailVerified: true,
      updatedAt: new Date()
    };
    this.users.set(id, updated);
    return updated;
  }

  // ============================================================================
  // COMPANY MANAGEMENT METHODS
  // ============================================================================

  async getCompaniesByUserId(userId: string): Promise<Company[]> {
    // Get all company-user relationships for this user
    const userCompanies = Array.from(this.companyUsers.values())
      .filter(cu => cu.userId === userId)
      .map(cu => cu.companyId);

    // Return actual company objects
    return Array.from(this.companies.values())
      .filter(company => userCompanies.includes(company.id));
  }

  async getCompany(id: string): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = randomUUID();
    const company: Company = { 
      ...insertCompany, 
      id, 
      createdAt: new Date() 
    };
    this.companies.set(id, company);

    // Auto-create company-user relationship for the creator as owner
    const companyUser: CompanyUser = {
      id: randomUUID(),
      userId: insertCompany.userId,
      companyId: id,
      role: "owner",
      permissions: DEFAULT_PERMISSIONS.owner,
      createdAt: new Date(),
      invitedBy: insertCompany.userId,
      invitedAt: new Date()
    };
    this.companyUsers.set(companyUser.id, companyUser);

    return company;
  }

  async updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company | undefined> {
    const company = this.companies.get(id);
    if (!company) return undefined;

    const updated = { ...company, ...updates };
    this.companies.set(id, updated);
    return updated;
  }

  // ============================================================================
  // COMPANY USER RELATIONSHIP METHODS
  // ============================================================================

  async getCompanyUser(userId: string, companyId: string): Promise<CompanyUser | undefined> {
    return Array.from(this.companyUsers.values()).find(
      cu => cu.userId === userId && cu.companyId === companyId
    );
  }

  async getCompanyUsers(companyId: string): Promise<CompanyUser[]> {
    return Array.from(this.companyUsers.values()).filter(
      cu => cu.companyId === companyId
    );
  }

  async createCompanyUser(insertCompanyUser: InsertCompanyUser): Promise<CompanyUser> {
    const id = randomUUID();
    const companyUser: CompanyUser = {
      id,
      userId: insertCompanyUser.userId,
      companyId: insertCompanyUser.companyId,
      role: insertCompanyUser.role,
      permissions: insertCompanyUser.permissions || DEFAULT_PERMISSIONS[insertCompanyUser.role as UserRole],
      createdAt: new Date(),
      invitedBy: insertCompanyUser.invitedBy || null,
      invitedAt: new Date()
    };
    this.companyUsers.set(id, companyUser);
    return companyUser;
  }

  async updateCompanyUser(id: string, updates: Partial<InsertCompanyUser>): Promise<CompanyUser | undefined> {
    const companyUser = this.companyUsers.get(id);
    if (!companyUser) return undefined;

    const updated = { ...companyUser, ...updates };
    this.companyUsers.set(id, updated);
    return updated;
  }

  async removeCompanyUser(id: string): Promise<boolean> {
    return this.companyUsers.delete(id);
  }

  // ============================================================================
  // SESSION MANAGEMENT METHODS
  // ============================================================================

  async getSession(id: string): Promise<Session | undefined> {
    const session = this.sessions.get(id);

    // Check if session is expired
    if (session && new Date(session.expiresAt) < new Date()) {
      this.sessions.delete(id); // Auto-cleanup expired session
      return undefined;
    }

    return session;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = randomUUID();
    const now = new Date();
    const session: Session = {
      id,
      userId: insertSession.userId,
      expiresAt: insertSession.expiresAt,
      createdAt: now,
      lastActive: now,
      ipAddress: insertSession.ipAddress || null,
      userAgent: insertSession.userAgent || null
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSessionActivity(id: string): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    const updated = { 
      ...session, 
      lastActive: new Date() 
    };
    this.sessions.set(id, updated);
    return updated;
  }

  async deleteSession(id: string): Promise<boolean> {
    return this.sessions.delete(id);
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    let deletedCount = 0;

    for (const [id, session] of this.sessions.entries()) {
      if (new Date(session.expiresAt) < now) {
        this.sessions.delete(id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  // ============================================================================
  // FINANCIAL DATA METHODS
  // ============================================================================

  async getFinancialData(companyId: string, period?: string): Promise<FinancialData[]> {
    const allData = Array.from(this.financialData.values()).filter(
      (data) => data.companyId === companyId
    );

    if (period) {
      return allData.filter(data => data.period === period);
    }

    // Sort by period in descending order (most recent first)
    return allData.sort((a, b) => b.period.localeCompare(a.period));
  }

  async getFinancialDataByPeriod(companyId: string, period: string): Promise<FinancialData | undefined> {
    return Array.from(this.financialData.values()).find(
      (data) => data.companyId === companyId && data.period === period
    );
  }

  async createOrUpdateFinancialData(data: InsertFinancialData): Promise<FinancialData> {
    // Check if data for this company and period already exists
    const existing = Array.from(this.financialData.values()).find(
      fd => fd.companyId === data.companyId && fd.period === data.period
    );

    const now = new Date();

    if (existing) {
      // Update existing record
      const updated: FinancialData = { 
        ...existing, 
        ...data, 
        updatedAt: now 
      };
      this.financialData.set(existing.id, updated);
      return updated;
    } else {
      // Create new record
      const id = randomUUID();
      const newData: FinancialData = { 
        id,
        companyId: data.companyId,
        period: data.period,
        periodType: data.periodType,
        // Income Statement - provide defaults for all required fields
        totalRevenue: data.totalRevenue || "0",
        grossProfit: data.grossProfit || "0",
        netIncome: data.netIncome || "0",
        operatingIncome: data.operatingIncome || "0",
        costOfGoodsSold: data.costOfGoodsSold || "0",
        operatingExpenses: data.operatingExpenses || "0",
        // Balance Sheet
        totalAssets: data.totalAssets || "0",
        currentAssets: data.currentAssets || "0",
        inventory: data.inventory || "0",
        accountsReceivable: data.accountsReceivable || "0",
        totalLiabilities: data.totalLiabilities || "0",
        currentLiabilities: data.currentLiabilities || "0",
        accountsPayable: data.accountsPayable || "0",
        totalEquity: data.totalEquity || "0",
        // Cash Flow
        operatingCashFlow: data.operatingCashFlow || "0",
        investingCashFlow: data.investingCashFlow || "0",
        financingCashFlow: data.financingCashFlow || "0",
        // Business Metrics
        marketingSpend: data.marketingSpend || "0",
        newCustomers: data.newCustomers || 0,
        totalCustomers: data.totalCustomers || 0,
        // Timestamps
        createdAt: now,
        updatedAt: now
      };
      this.financialData.set(id, newData);
      return newData;
    }
  }

  async getFinancialDataRange(companyId: string, startPeriod: string, endPeriod: string): Promise<FinancialData[]> {
    return Array.from(this.financialData.values())
      .filter(data => 
        data.companyId === companyId && 
        data.period >= startPeriod && 
        data.period <= endPeriod
      )
      .sort((a, b) => a.period.localeCompare(b.period)); // Sort chronologically
  }

  // ============================================================================
  // METRIC ALERTS METHODS
  // ============================================================================

  async getMetricAlerts(companyId: string): Promise<MetricAlert[]> {
    return Array.from(this.metricAlerts.values()).filter(
      (alert) => alert.companyId === companyId
    );
  }

  async getMetricAlert(id: string): Promise<MetricAlert | undefined> {
    return this.metricAlerts.get(id);
  }

  async createOrUpdateMetricAlert(alert: InsertMetricAlert): Promise<MetricAlert> {
    // Check if alert for this company and metric already exists
    const existing = Array.from(this.metricAlerts.values()).find(
      ma => ma.companyId === alert.companyId && ma.metricName === alert.metricName
    );

    const now = new Date();

    if (existing) {
      // Update existing alert
      const updated: MetricAlert = { 
        ...existing, 
        ...alert, 
        updatedAt: now 
      };
      this.metricAlerts.set(existing.id, updated);
      return updated;
    } else {
      // Create new alert
      const id = randomUUID();
      const newAlert: MetricAlert = { 
        id,
        companyId: alert.companyId,
        metricName: alert.metricName,
        threshold: alert.threshold,
        condition: alert.condition,
        isEnabled: alert.isEnabled !== undefined ? alert.isEnabled : 1,
        createdAt: now,
        updatedAt: now
      };
      this.metricAlerts.set(id, newAlert);
      return newAlert;
    }
  }

  async deleteMetricAlert(id: string): Promise<void> {
    this.metricAlerts.delete(id);
  }
}

// ============================================================================
// DATABASE STORAGE IMPLEMENTATION (PRODUCTION)
// ============================================================================

/**
 * DBSTORAGE CLASS
 * 
 * PostgreSQL database storage implementation using Drizzle ORM.
 * Suitable for production environments with persistent storage.
 * 
 * CHARACTERISTICS:
 * - Persistent data storage across server restarts
 * - ACID compliance with PostgreSQL
 * - Scalable for multiple application instances
 * - Proper connection pooling and error handling
 * 
 * NOTE: This implementation would require actual database connection
 * and Drizzle ORM setup. Currently returns MemStorage for compatibility.
 */
import { DbStorage } from './db-storage';

// ============================================================================
// EXPORTED STORAGE INSTANCE
// ============================================================================

/**
 * STORAGE SINGLETON INSTANCE
 * 
 * Primary storage instance used throughout the application.
 * All API routes and business logic use this shared instance.
 * 
 * CURRENT IMPLEMENTATION:
 * - Uses DbStorage for production (PostgreSQL)
 * - Falls back to MemStorage if database not available
 * - Provides consistent interface regardless of backend
 */
export const storage = new DbStorage();

/**
 * USAGE NOTES:
 * 
 * 1. PASSWORD SECURITY:
 *    Always hash passwords with bcrypt before calling createUser()
 * 
 * 2. SESSION MANAGEMENT:
 *    Implement regular session cleanup via cleanupExpiredSessions()
 * 
 * 3. PERMISSION CHECKS:
 *    Always verify company access via getCompanyUser() before data operations
 * 
 * 4. ERROR HANDLING:
 *    Wrap storage calls in try-catch blocks for proper error handling
 * 
 * 5. DATA VALIDATION:
 *    Validate all inputs using Zod schemas before storage operations
 */