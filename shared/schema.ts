/**
 * ============================================================================
 * DATABASE SCHEMA
 * ============================================================================
 * 
 * Drizzle ORM schema definitions for the VO Ledger PostgreSQL database.
 * Defines all tables, relationships, constraints, and validation schemas.
 * 
 * Database Provider: PostgreSQL (Neon Serverless)
 * ORM: Drizzle ORM
 * Validation: Zod schemas generated from Drizzle definitions
 * 
 * Tables:
 * - users: User accounts with authentication
 * - companies: Companies owned by users
 * - financial_data: Financial records per company and period
 * - metric_alerts: Custom threshold alerts for metrics
 * 
 * Key Features:
 * - UUID primary keys auto-generated via PostgreSQL
 * - Unique constraints for data integrity
 * - Foreign key relationships with referential integrity
 * - Decimal precision for financial values (15 digits, 2 decimal places)
 * - Timestamp tracking for created/updated records
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// TABLE DEFINITIONS
// ============================================================================

/**
 * Users Table
 * 
 * Stores user accounts for authentication and authorization.
 * Each user can own multiple companies.
 * 
 * Constraints:
 * - Primary key: id (UUID, auto-generated)
 * - Unique: username (prevents duplicate accounts)
 * 
 * @table users
 */
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),        // User's email/username (unique)
  password: text("password").notNull(),                 // Hashed password
});

/**
 * Companies Table
 * 
 * Stores company information linked to user accounts.
 * One user can have multiple companies (one-to-many relationship).
 * 
 * Relationships:
 * - Belongs to: users (via userId foreign key)
 * - Has many: financialData, metricAlerts
 * 
 * Constraints:
 * - Primary key: id (UUID, auto-generated)
 * - Foreign key: userId references users(id)
 * 
 * @table companies
 */
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),                         // Company name
  userId: varchar("user_id")                            // Owner's user ID
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),      // Record creation timestamp
});

/**
 * Metric Alerts Table
 * 
 * Stores custom threshold alerts for financial metrics.
 * Allows users to set notifications when metrics cross specified thresholds.
 * 
 * Relationships:
 * - Belongs to: companies (via companyId foreign key)
 * 
 * Constraints:
 * - Primary key: id (UUID, auto-generated)
 * - Foreign key: companyId references companies(id)
 * - Unique: (companyId, metricName) - One alert per metric per company
 * 
 * Alert Conditions:
 * - "above": Trigger when metric exceeds threshold
 * - "below": Trigger when metric falls below threshold
 * 
 * @table metric_alerts
 */
export const metricAlerts = pgTable("metric_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id")                      // Company this alert belongs to
    .references(() => companies.id)
    .notNull(),
  metricName: text("metric_name").notNull(),            // Metric identifier (e.g., "currentRatio")
  threshold: decimal("threshold", { 
    precision: 15, 
    scale: 2 
  }).notNull(),                                         // Alert threshold value
  condition: text("condition").notNull(),               // "above" or "below"
  isEnabled: integer("is_enabled")                      // 1 = enabled, 0 = disabled
    .default(1)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),      // Record creation timestamp
  updatedAt: timestamp("updated_at").defaultNow(),      // Last update timestamp
}, (table) => ({
  // Ensure only one alert per metric per company
  uniqueCompanyMetric: unique().on(table.companyId, table.metricName),
}));

/**
 * Financial Data Table
 * 
 * Stores raw financial data for companies across different time periods.
 * Contains income statement, balance sheet, cash flow, and business metrics.
 * 
 * Relationships:
 * - Belongs to: companies (via companyId foreign key)
 * 
 * Constraints:
 * - Primary key: id (UUID, auto-generated)
 * - Foreign key: companyId references companies(id)
 * - Unique: (companyId, period) - One record per company per period
 * 
 * Period Types:
 * - "yearly": Annual periods (e.g., "2024")
 * - "quarterly": Quarterly periods (e.g., "2024-Q1")
 * - "monthly": Monthly periods (e.g., "2024-01")
 * 
 * Financial Data Categories:
 * 1. Income Statement: Revenue, profits, costs, expenses
 * 2. Balance Sheet: Assets, liabilities, equity, inventory, receivables
 * 3. Cash Flow: Operating, investing, financing cash flows
 * 4. Business Metrics: Marketing spend, customer counts
 * 
 * Decimal Precision:
 * - All monetary values: 15 digits total, 2 decimal places
 * - Supports values up to $999,999,999,999.99
 * 
 * @table financial_data
 */
export const financialData = pgTable("financial_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id")                      // Company this data belongs to
    .references(() => companies.id)
    .notNull(),
  period: text("period").notNull(),                     // Period identifier (e.g., "2024", "2024-Q1")
  periodType: text("period_type").notNull(),            // "monthly", "quarterly", or "yearly"
  
  // ========================================
  // INCOME STATEMENT
  // ========================================
  totalRevenue: decimal("total_revenue", { 
    precision: 15, 
    scale: 2 
  }).default("0"),                                      // Total sales revenue
  
  grossProfit: decimal("gross_profit", { 
    precision: 15, 
    scale: 2 
  }).default("0"),                                      // Revenue minus COGS
  
  netIncome: decimal("net_income", { 
    precision: 15, 
    scale: 2 
  }).default("0"),                                      // Bottom line profit
  
  operatingIncome: decimal("operating_income", { 
    precision: 15, 
    scale: 2 
  }).default("0"),                                      // Profit from core operations
  
  costOfGoodsSold: decimal("cost_of_goods_sold", { 
    precision: 15, 
    scale: 2 
  }).default("0"),                                      // Direct costs of production
  
  operatingExpenses: decimal("operating_expenses", { 
    precision: 15, 
    scale: 2 
  }).default("0"),                                      // Operating costs (SG&A, etc.)
  
  // ========================================
  // BALANCE SHEET
  // ========================================
  totalAssets: decimal("total_assets", { 
    precision: 15, 
    scale: 2 
  }).default("0"),                                      // All company assets
  
  currentAssets: decimal("current_assets", { 
    precision: 15, 
    scale: 2 
  }).default("0"),                                      // Assets convertible within 1 year
  
  inventory: decimal("inventory", { 
    precision: 15, 
    scale: 2 
  }).default("0"),                                      // Inventory value
  
  accountsReceivable: decimal("accounts_receivable", { 
    precision: 15, 
    scale: 2 
  }).default("0"),                                      // Money owed by customers
  
  totalLiabilities: decimal("total_liabilities", { 
    precision: 15, 
    scale: 2 
  }).default("0"),                                      // All company liabilities
  
  currentLiabilities: decimal("current_liabilities", { 
    precision: 15, 
    scale: 2 
  }).default("0"),                                      // Liabilities due within 1 year
  
  accountsPayable: decimal("accounts_payable", { 
    precision: 15, 
    scale: 2 
  }).default("0"),                                      // Money owed to suppliers
  
  totalEquity: decimal("total_equity", { 
    precision: 15, 
    scale: 2 
  }).default("0"),                                      // Shareholders' equity
  
  // ========================================
  // CASH FLOW STATEMENT
  // ========================================
  operatingCashFlow: decimal("operating_cash_flow", { 
    precision: 15, 
    scale: 2 
  }).default("0"),                                      // Cash from operations
  
  investingCashFlow: decimal("investing_cash_flow", { 
    precision: 15, 
    scale: 2 
  }).default("0"),                                      // Cash from investments (usually negative)
  
  financingCashFlow: decimal("financing_cash_flow", { 
    precision: 15, 
    scale: 2 
  }).default("0"),                                      // Cash from financing activities
  
  // ========================================
  // BUSINESS METRICS
  // ========================================
  marketingSpend: decimal("marketing_spend", { 
    precision: 15, 
    scale: 2 
  }).default("0"),                                      // Marketing and advertising costs
  
  newCustomers: integer("new_customers").default(0),    // New customers acquired in period
  totalCustomers: integer("total_customers").default(0), // Total active customers
  
  // ========================================
  // TIMESTAMPS
  // ========================================
  createdAt: timestamp("created_at").defaultNow(),      // Record creation timestamp
  updatedAt: timestamp("updated_at").defaultNow(),      // Last update timestamp
}, (table) => ({
  // Ensure only one financial record per company per period
  uniqueCompanyPeriod: unique().on(table.companyId, table.period),
}));

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * User Insert Schema
 * 
 * Validates user creation requests.
 * Automatically omits auto-generated fields (id, timestamps).
 */
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

/**
 * Company Insert Schema
 * 
 * Validates company creation requests.
 * Automatically omits auto-generated fields (id, timestamps).
 */
export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  userId: true,
});

/**
 * Financial Data Insert Schema
 * 
 * Validates financial data creation/update requests.
 * Omits auto-generated fields (id, createdAt, updatedAt).
 * Includes all financial metrics and period information.
 */
export const insertFinancialDataSchema = createInsertSchema(financialData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Metric Alert Insert Schema
 * 
 * Validates metric alert creation/update requests.
 * Omits auto-generated fields (id, createdAt, updatedAt).
 */
export const insertMetricAlertSchema = createInsertSchema(metricAlerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

/**
 * Type Definitions
 * 
 * Generated from Drizzle schemas and Zod validation schemas.
 * 
 * Insert Types: Used for creating new records (omits auto-generated fields)
 * Select Types: Full record types including all database fields
 */

// User types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Company types
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// Financial data types
export type InsertFinancialData = z.infer<typeof insertFinancialDataSchema>;
export type FinancialData = typeof financialData.$inferSelect;

// Metric alert types
export type InsertMetricAlert = z.infer<typeof insertMetricAlertSchema>;
export type MetricAlert = typeof metricAlerts.$inferSelect;
