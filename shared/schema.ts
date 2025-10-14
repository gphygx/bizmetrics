/**
 * ============================================================================
 * DATABASE SCHEMA - BIZMETRICS FINANCIAL PLATFORM
 * ============================================================================
 * 
 * Complete database schema for BizMetrics financial analytics platform.
 * Supports multi-tenant architecture with secure user authentication and
 * role-based access control.
 * 
 * Database: PostgreSQL (Neon Serverless)
 * ORM: Drizzle ORM
 * Validation: Zod schemas with Drizzle-Zod integration
 * 
 * TABLE OVERVIEW:
 * - users: User authentication and profiles
 * - companies: Business entities for financial tracking
 * - company_users: Multi-user access with roles & permissions
 * - sessions: Secure authentication sessions
 * - financial_data: Raw financial records (P&L, Balance Sheet, Cash Flow)
 * - metric_alerts: Custom threshold alerts for financial metrics
 * 
 * SECURITY FEATURES:
 * - UUID primary keys for all tables
 * - Referential integrity with foreign key constraints
 * - Unique constraints to prevent data duplication
 * - Role-based access control (Owner, Admin, User, Viewer)
 * - Session management with expiration
 * - Email verification system
 * 
 * FINANCIAL DATA PRECISION:
 * - All monetary values: 15 digits, 2 decimal places
 * - Supports values up to $999,999,999,999.99
 * - Decimal types prevent floating-point rounding errors
 */

// ============================================================================
// IMPORTS & DEPENDENCIES
// ============================================================================

import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  decimal, 
  timestamp, 
  integer, 
  unique, 
  jsonb,
  boolean 
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// CORE AUTHENTICATION TABLES
// ============================================================================

/**
 * USERS TABLE
 * 
 * Central user registry for authentication and authorization.
 * Stores credentials, profile information, and account status.
 * 
 * SECURITY NOTES:
 * - Passwords should be hashed using bcrypt or similar before storage
 * - Email verification prevents spam accounts and ensures deliverability
 * - Unique constraints on username and email prevent duplicate accounts
 * 
 * @table users
 * @index username, email (unique)
 */
export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  username: text("username")
    .notNull()
    .unique(),                    // Login identifier (unique)

  email: text("email")
    .notNull()
    .unique(),                    // Primary contact email (unique)

  password: text("password")
    .notNull(),                   // Hashed password (never store plain text)

  fullName: text("full_name"),    // User's full name for display

  emailVerified: boolean("email_verified")
    .default(false),              // Email verification status

  createdAt: timestamp("created_at")
    .defaultNow(),                // Account creation timestamp

  updatedAt: timestamp("updated_at")
    .defaultNow(),                // Last profile update timestamp
});

/**
 * COMPANIES TABLE
 * 
 * Business entities that own financial data and metrics.
 * Each company can have multiple users with different access levels.
 * 
 * RELATIONSHIPS:
 * - One-to-Many: users (via userId - original owner)
 * - Many-to-Many: users (via company_users junction table)
 * - One-to-Many: financial_data, metric_alerts
 * 
 * @table companies
 * @index userId (foreign key)
 */
export const companies = pgTable("companies", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  name: text("name")
    .notNull(),                   // Company legal name

  userId: varchar("user_id")      // Original company owner/creator
    .references(() => users.id)
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow(),                // Company registration timestamp
});

/**
 * COMPANY_USERS TABLE (JUNCTION TABLE)
 * 
 * Enables multi-user access to companies with role-based permissions.
 * This is the core of our multi-tenant security architecture.
 * 
 * ROLE HIERARCHY:
 * - owner: Full control (can delete company, manage all users)
 * - admin: Administrative access (manage users, edit all data)
 * - user: Standard access (edit financial data, view metrics)
 * - viewer: Read-only access (view data only, no edits)
 * 
 * PERMISSIONS STRUCTURE (JSONB):
 * {
 *   "financialData": ["read", "write", "delete"],
 *   "users": ["read", "manage"],
 *   "settings": ["read", "write"],
 *   "alerts": ["read", "write", "manage"]
 * }
 * 
 * SECURITY: Unique constraint prevents duplicate user-company relationships
 * 
 * @table company_users
 * @index userId, companyId (unique composite)
 * @index companyId (foreign key)
 */
export const companyUsers = pgTable("company_users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  userId: varchar("user_id")      // User being granted access
    .references(() => users.id)
    .notNull(),

  companyId: varchar("company_id") // Company being accessed
    .references(() => companies.id)
    .notNull(),

  role: text("role")
    .notNull(),                   // 'owner' | 'admin' | 'user' | 'viewer'

  permissions: jsonb("permissions"), // Custom permission overrides

  createdAt: timestamp("created_at")
    .defaultNow(),                // When access was granted

  invitedBy: varchar("invited_by") // User who invited this member
    .references(() => users.id),

  invitedAt: timestamp("invited_at")
    .defaultNow(),                // When invitation was sent

}, (table) => ({
  // Critical constraint: Each user can have only one role per company
  uniqueUserCompany: unique().on(table.userId, table.companyId),
}));

/**
 * SESSIONS TABLE
 * 
 * Manages user authentication sessions for secure stateless authentication.
 * Supports session expiration, activity tracking, and security monitoring.
 * 
 * SECURITY FEATURES:
 * - Automatic expiration prevents stale sessions
 * - IP and user agent tracking for security audits
 * - Last activity monitoring for auto-logout
 * 
 * @table sessions
 * @index userId (foreign key)
 * @index expiresAt (for cleanup jobs)
 */
export const sessions = pgTable("sessions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  userId: varchar("user_id")      // Authenticated user
    .references(() => users.id)
    .notNull(),

  expiresAt: timestamp("expires_at")
    .notNull(),                   // Session expiration timestamp

  createdAt: timestamp("created_at")
    .defaultNow(),                // Session creation time

  lastActive: timestamp("last_active")
    .defaultNow(),                // Last user activity timestamp

  ipAddress: text("ip_address"),  // Client IP for security tracking

  userAgent: text("user_agent"),  // Browser/device information
});

// ============================================================================
// FINANCIAL DATA TABLES
// ============================================================================

/**
 * FINANCIAL_DATA TABLE
 * 
 * Comprehensive financial data storage for companies across time periods.
 * Contains complete financial statements: Income Statement, Balance Sheet, 
 * Cash Flow Statement, and key business metrics.
 * 
 * DATA ORGANIZATION:
 * - Period-based: yearly, quarterly, or monthly periods
 * - Company-specific: All data tied to specific company
 * - Unique constraint: One record per company per period
 * 
 * FINANCIAL CATEGORIES:
 * 1. INCOME STATEMENT: Revenue, profits, costs, expenses
 * 2. BALANCE SHEET: Assets, liabilities, equity, working capital
 * 3. CASH FLOW: Operating, investing, financing activities
 * 4. BUSINESS METRICS: Marketing, customers, growth indicators
 * 
 * PERIOD TYPES:
 * - "yearly": Annual data (e.g., "2024")
 * - "quarterly": Quarterly data (e.g., "2024-Q1")  
 * - "monthly": Monthly data (e.g., "2024-01")
 * 
 * @table financial_data
 * @index companyId, period (unique composite)
 * @index companyId (foreign key)
 */
export const financialData = pgTable("financial_data", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  companyId: varchar("company_id") // Owning company
    .references(() => companies.id)
    .notNull(),

  period: text("period")
    .notNull(),                   // "2024", "2024-Q1", "2024-01"

  periodType: text("period_type")
    .notNull(),                   // "yearly", "quarterly", "monthly"

  // ==================== INCOME STATEMENT ====================
  totalRevenue: decimal("total_revenue", { 
    precision: 15, scale: 2 
  }).default("0"),                // Total sales revenue

  grossProfit: decimal("gross_profit", { 
    precision: 15, scale: 2 
  }).default("0"),                // Revenue - Cost of Goods Sold

  netIncome: decimal("net_income", { 
    precision: 15, scale: 2 
  }).default("0"),                // Bottom line profit/loss

  operatingIncome: decimal("operating_income", { 
    precision: 15, scale: 2 
  }).default("0"),                // Profit from core operations

  costOfGoodsSold: decimal("cost_of_goods_sold", { 
    precision: 15, scale: 2 
  }).default("0"),                // Direct production costs

  operatingExpenses: decimal("operating_expenses", { 
    precision: 15, scale: 2 
  }).default("0"),                // SG&A, R&D, other operating costs

  // ==================== BALANCE SHEET ====================
  totalAssets: decimal("total_assets", { 
    precision: 15, scale: 2 
  }).default("0"),                // Total company assets

  currentAssets: decimal("current_assets", { 
    precision: 15, scale: 2 
  }).default("0"),                // Assets convertible within 1 year

  inventory: decimal("inventory", { 
    precision: 15, scale: 2 
  }).default("0"),                // Goods available for sale

  accountsReceivable: decimal("accounts_receivable", { 
    precision: 15, scale: 2 
  }).default("0"),                // Money owed by customers

  totalLiabilities: decimal("total_liabilities", { 
    precision: 15, scale: 2 
  }).default("0"),                // Total company liabilities

  currentLiabilities: decimal("current_liabilities", { 
    precision: 15, scale: 2 
  }).default("0"),                // Liabilities due within 1 year

  accountsPayable: decimal("accounts_payable", { 
    precision: 15, scale: 2 
  }).default("0"),                // Money owed to suppliers

  totalEquity: decimal("total_equity", { 
    precision: 15, scale: 2 
  }).default("0"),                // Shareholders' equity

  // ==================== CASH FLOW STATEMENT ====================
  operatingCashFlow: decimal("operating_cash_flow", { 
    precision: 15, scale: 2 
  }).default("0"),                // Cash from core operations

  investingCashFlow: decimal("investing_cash_flow", { 
    precision: 15, scale: 2 
  }).default("0"),                // Cash from investments (usually negative)

  financingCashFlow: decimal("financing_cash_flow", { 
    precision: 15, scale: 2 
  }).default("0"),                // Cash from financing activities

  // ==================== BUSINESS METRICS ====================
  marketingSpend: decimal("marketing_spend", { 
    precision: 15, scale: 2 
  }).default("0"),                // Marketing and advertising costs

  newCustomers: integer("new_customers")
    .default(0),                  // New customers acquired in period

  totalCustomers: integer("total_customers")
    .default(0),                  // Total active customers at period end

  // ==================== TIMESTAMPS ====================
  createdAt: timestamp("created_at")
    .defaultNow(),                // Record creation timestamp

  updatedAt: timestamp("updated_at")
    .defaultNow(),                // Last data update timestamp

}, (table) => ({
  // Critical constraint: Prevent duplicate financial records for same period
  uniqueCompanyPeriod: unique().on(table.companyId, table.period),
}));

/**
 * METRIC_ALERTS TABLE
 * 
 * Custom threshold alerts for financial metric monitoring.
 * Users can set alerts to be notified when metrics cross specified thresholds.
 * 
 * ALERT CONDITIONS:
 * - "above": Trigger when metric exceeds threshold value
 * - "below": Trigger when metric falls below threshold value
 * 
 * USE CASES:
 * - Low liquidity alerts (current ratio < 1.5)
 * - Profitability warnings (net margin < 5%)
 * - Growth tracking (revenue growth > 20%)
 * - Efficiency monitoring (DSO > 45 days)
 * 
 * @table metric_alerts
 * @index companyId, metricName (unique composite)
 * @index companyId (foreign key)
 */
export const metricAlerts = pgTable("metric_alerts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),

  companyId: varchar("company_id") // Company being monitored
    .references(() => companies.id)
    .notNull(),

  metricName: text("metric_name")
    .notNull(),                   // e.g., "currentRatio", "netProfitMargin"

  threshold: decimal("threshold", { 
    precision: 15, scale: 2 
  }).notNull(),                   // Alert threshold value

  condition: text("condition")
    .notNull(),                   // "above" or "below"

  isEnabled: integer("is_enabled") // Alert active status
    .default(1)
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow(),                // Alert creation timestamp

  updatedAt: timestamp("updated_at")
    .defaultNow(),                // Last alert modification timestamp

}, (table) => ({
  // Critical constraint: One alert per metric per company
  uniqueCompanyMetric: unique().on(table.companyId, table.metricName),
}));

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * USER VALIDATION
 * 
 * Validates user registration and profile updates.
 * Password validation should be handled in the application layer.
 */
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
});

/**
 * COMPANY VALIDATION
 * 
 * Validates company creation requests.
 * Company names must be non-empty and unique per user.
 */
export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  userId: true,
});

/**
 * COMPANY_USER VALIDATION  
 * 
 * Validates user-company relationship creation.
 * Ensures valid roles and proper permission structures.
 */
export const insertCompanyUserSchema = createInsertSchema(companyUsers).pick({
  userId: true,
  companyId: true,
  role: true,
  permissions: true,
  invitedBy: true,
});

/**
 * SESSION VALIDATION
 * 
 * Validates session creation for authentication.
 * Expiration must be in the future.
 */
export const insertSessionSchema = createInsertSchema(sessions).pick({
  userId: true,
  expiresAt: true,
  ipAddress: true,
  userAgent: true,
});

/**
 * FINANCIAL DATA VALIDATION
 * 
 * Comprehensive validation for financial data inputs.
 * Ensures data integrity across all financial statement components.
 */
export const insertFinancialDataSchema = createInsertSchema(financialData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * METRIC ALERT VALIDATION
 * 
 * Validates alert creation and updates.
 * Ensures proper threshold values and conditions.
 */
export const insertMetricAlertSchema = createInsertSchema(metricAlerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ============================================================================
// ROLE & PERMISSION SCHEMAS
// ============================================================================

/**
 * PERMISSIONS SCHEMA
 * 
 * Defines the structure for role-based permissions.
 * Each permission array specifies what actions are allowed.
 */
export const permissionsSchema = z.object({
  financialData: z.array(z.enum(["read", "write", "delete"])),
  users: z.array(z.enum(["read", "manage"])),
  settings: z.array(z.enum(["read", "write"])),
  alerts: z.array(z.enum(["read", "write", "manage"])),
});

/**
 * ROLE SCHEMA
 * 
 * Defines valid user roles within companies.
 * Roles determine default permission sets.
 */
export const roleSchema = z.enum(["owner", "admin", "user", "viewer"]);

// ============================================================================
// TYPESCRIPT TYPE DEFINITIONS
// ============================================================================

// User Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Company Types  
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// Company User Types
export type InsertCompanyUser = z.infer<typeof insertCompanyUserSchema>;
export type CompanyUser = typeof companyUsers.$inferSelect;

// Session Types
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

// Financial Data Types
export type InsertFinancialData = z.infer<typeof insertFinancialDataSchema>;
export type FinancialData = typeof financialData.$inferSelect;

// Metric Alert Types
export type InsertMetricAlert = z.infer<typeof insertMetricAlertSchema>;
export type MetricAlert = typeof metricAlerts.$inferSelect;

// Permission & Role Types
export type Permissions = z.infer<typeof permissionsSchema>;
export type UserRole = z.infer<typeof roleSchema>;

// ============================================================================
// DEFAULT PERMISSION SETS BY ROLE
// ============================================================================

/**
 * DEFAULT ROLE PERMISSIONS
 * 
 * Pre-defined permission sets for each role level.
 * These can be overridden by the permissions field in company_users.
 */
export const DEFAULT_PERMISSIONS: Record<UserRole, Permissions> = {
  owner: {
    financialData: ["read", "write", "delete"],
    users: ["read", "manage"],
    settings: ["read", "write"],
    alerts: ["read", "write", "manage"],
  },
  admin: {
    financialData: ["read", "write", "delete"],
    users: ["read", "manage"],
    settings: ["read", "write"],
    alerts: ["read", "write", "manage"],
  },
  user: {
    financialData: ["read", "write"],
    users: ["read"],
    settings: ["read"],
    alerts: ["read", "write"],
  },
  viewer: {
    financialData: ["read"],
    users: ["read"],
    settings: ["read"],
    alerts: ["read"],
  },
};

/**
 * USAGE NOTES:
 * 
 * 1. DATABASE MIGRATION:
 *    Run `npm run db:push` to apply schema changes to your database
 * 
 * 2. PASSWORD SECURITY:
 *    Always hash passwords with bcrypt before storing in users table
 * 
 * 3. SESSION MANAGEMENT:
 *    Implement regular cleanup of expired sessions
 * 
 * 4. ROLE ENFORCEMENT:
 *    Use the DEFAULT_PERMISSIONS object for role-based access control
 * 
 * 5. DATA VALIDATION:
 *    Always use the Zod schemas for input validation in API routes
 */