import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const metricAlerts = pgTable("metric_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id).notNull(),
  metricName: text("metric_name").notNull(), // e.g., "revenue", "netProfitMargin"
  threshold: decimal("threshold", { precision: 15, scale: 2 }).notNull(),
  condition: text("condition").notNull(), // "above", "below"
  isEnabled: integer("is_enabled").default(1).notNull(), // 1 = enabled, 0 = disabled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueCompanyMetric: unique().on(table.companyId, table.metricName),
}));

export const financialData = pgTable("financial_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id).notNull(),
  period: text("period").notNull(), // e.g., "2024-Q1", "2024-01", "2024"
  periodType: text("period_type").notNull(), // "monthly", "quarterly", "yearly"
  
  // Revenue & Income Statement
  totalRevenue: decimal("total_revenue", { precision: 15, scale: 2 }).default("0"),
  grossProfit: decimal("gross_profit", { precision: 15, scale: 2 }).default("0"),
  netIncome: decimal("net_income", { precision: 15, scale: 2 }).default("0"),
  operatingIncome: decimal("operating_income", { precision: 15, scale: 2 }).default("0"),
  costOfGoodsSold: decimal("cost_of_goods_sold", { precision: 15, scale: 2 }).default("0"),
  operatingExpenses: decimal("operating_expenses", { precision: 15, scale: 2 }).default("0"),
  
  // Balance Sheet
  totalAssets: decimal("total_assets", { precision: 15, scale: 2 }).default("0"),
  currentAssets: decimal("current_assets", { precision: 15, scale: 2 }).default("0"),
  inventory: decimal("inventory", { precision: 15, scale: 2 }).default("0"),
  accountsReceivable: decimal("accounts_receivable", { precision: 15, scale: 2 }).default("0"),
  totalLiabilities: decimal("total_liabilities", { precision: 15, scale: 2 }).default("0"),
  currentLiabilities: decimal("current_liabilities", { precision: 15, scale: 2 }).default("0"),
  accountsPayable: decimal("accounts_payable", { precision: 15, scale: 2 }).default("0"),
  totalEquity: decimal("total_equity", { precision: 15, scale: 2 }).default("0"),
  
  // Cash Flow
  operatingCashFlow: decimal("operating_cash_flow", { precision: 15, scale: 2 }).default("0"),
  investingCashFlow: decimal("investing_cash_flow", { precision: 15, scale: 2 }).default("0"),
  financingCashFlow: decimal("financing_cash_flow", { precision: 15, scale: 2 }).default("0"),
  
  // Additional metrics
  marketingSpend: decimal("marketing_spend", { precision: 15, scale: 2 }).default("0"),
  newCustomers: integer("new_customers").default(0),
  totalCustomers: integer("total_customers").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueCompanyPeriod: unique().on(table.companyId, table.period),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  userId: true,
});

export const insertFinancialDataSchema = createInsertSchema(financialData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMetricAlertSchema = createInsertSchema(metricAlerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;
export type InsertFinancialData = z.infer<typeof insertFinancialDataSchema>;
export type FinancialData = typeof financialData.$inferSelect;
export type InsertMetricAlert = z.infer<typeof insertMetricAlertSchema>;
export type MetricAlert = typeof metricAlerts.$inferSelect;
