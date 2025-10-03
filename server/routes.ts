/**
 * ============================================================================
 * API ROUTES - Financial Metrics Server
 * ============================================================================
 * 
 * Defines all REST API endpoints for the VO Ledger application.
 * Handles financial data management, metric calculations, and alert systems.
 * 
 * Route Categories:
 * - Company Management: Get companies by user
 * - Financial Data: CRUD operations for raw financial data
 * - Metrics: Calculated financial metrics with comparison support
 * - Historical Data: Time-series data for charts and trend analysis
 * - Alerts: Custom metric threshold alerts
 * 
 * All routes use the storage abstraction layer for database operations.
 */

// ============================================================================
// IMPORTS
// ============================================================================

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFinancialDataSchema, insertMetricAlertSchema } from "@shared/schema";
import { z } from "zod";

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

/**
 * Registers all API routes with the Express application
 * 
 * @param {Express} app - The Express application instance
 * @returns {Promise<Server>} HTTP server instance
 */
export async function registerRoutes(app: Express): Promise<Server> {
  
  // ==========================================================================
  // COMPANY ROUTES
  // ==========================================================================
  
  /**
   * GET /api/companies/:userId
   * 
   * Retrieves all companies associated with a specific user.
   * 
   * @param {string} userId - The user's unique identifier
   * @returns {Array} List of company objects
   */
  app.get("/api/companies/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const companies = await storage.getCompaniesByUserId(userId);
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==========================================================================
  // FINANCIAL DATA ROUTES
  // ==========================================================================

  /**
   * GET /api/financial-data/:companyId
   * 
   * Retrieves financial data for a company, optionally filtered by period.
   * 
   * @param {string} companyId - The company's unique identifier
   * @param {string} [period] - Optional query parameter to filter by period (e.g., "2024")
   * @returns {Array|Object} Financial data entries
   */
  app.get("/api/financial-data/:companyId", async (req, res) => {
    try {
      const { companyId } = req.params;
      const { period } = req.query;
      const data = await storage.getFinancialData(companyId, period as string);
      res.json(data);
    } catch (error) {
      console.error("Error fetching financial data:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  /**
   * GET /api/financial-data/:companyId/:period
   * 
   * Retrieves financial data for a specific company and period.
   * Returns 404 if no data exists for the specified period.
   * 
   * @param {string} companyId - The company's unique identifier
   * @param {string} period - The period identifier (e.g., "2024", "2024-Q1")
   * @returns {Object} Financial data for the specified period
   */
  app.get("/api/financial-data/:companyId/:period", async (req, res) => {
    try {
      const { companyId, period } = req.params;
      const data = await storage.getFinancialDataByPeriod(companyId, period);
      
      if (!data) {
        return res.status(404).json({ message: "Financial data not found" });
      }
      
      res.json(data);
    } catch (error) {
      console.error("Error fetching financial data:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  /**
   * POST /api/financial-data
   * 
   * Creates new financial data or updates existing data for a company period.
   * Uses upsert pattern (companyId + period unique constraint).
   * 
   * Validates request body against insertFinancialDataSchema before processing.
   * 
   * @body {FinancialDataInsert} Financial data object
   * @returns {Object} Created or updated financial data entry
   * @throws {400} If validation fails (returns Zod errors)
   * @throws {500} If database operation fails
   */
  app.post("/api/financial-data", async (req, res) => {
    try {
      // Validate request body using Zod schema
      const validatedData = insertFinancialDataSchema.parse(req.body);
      const data = await storage.createOrUpdateFinancialData(validatedData);
      res.json(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors 
        });
      }
      console.error("Error creating/updating financial data:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==========================================================================
  // METRICS CALCULATION ROUTES
  // ==========================================================================

  /**
   * GET /api/metrics/:companyId
   * 
   * Calculates and returns all 27 financial metrics for a company.
   * Supports period-over-period comparison for trend analysis.
   * 
   * @param {string} companyId - The company's unique identifier
   * @param {string} [period] - Query param for current period (default: "2024")
   * @param {string} [comparePeriod] - Query param for comparison period (optional)
   * @returns {Object} Calculated metrics with optional change percentages
   * 
   * Metrics include:
   * - Profitability: margins, ROA, ROE, CAC, EBITDA
   * - Liquidity: current ratio, quick ratio, working capital, DSO, CCC
   * - Efficiency: turnover ratios, LTV
   * - Leverage: debt ratios, free cash flow
   * - Growth: revenue, customer, profit growth
   */
  app.get("/api/metrics/:companyId", async (req, res) => {
    try {
      const { companyId } = req.params;
      const { period, comparePeriod } = req.query;
      
      // Fetch current period data
      const currentData = await storage.getFinancialDataByPeriod(
        companyId, 
        period as string || "2024"
      );
      
      // Fetch comparison period data if requested
      const compareData = (comparePeriod && comparePeriod !== 'none')
        ? await storage.getFinancialDataByPeriod(companyId, comparePeriod as string)
        : null;

      if (!currentData) {
        return res.status(404).json({ message: "Financial data not found" });
      }

      // Calculate all metrics with optional period-over-period comparison
      const metrics = calculateFinancialMetrics(currentData, compareData);
      res.json(metrics);
    } catch (error) {
      console.error("Error calculating metrics:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  /**
   * GET /api/metrics/:companyId/history
   * 
   * Returns historical financial metrics for all periods.
   * Used for trend charts and time-series visualization.
   * 
   * @param {string} companyId - The company's unique identifier
   * @returns {Array} Array of metric objects sorted by period
   * 
   * Each object contains:
   * - period: Period identifier (e.g., "2024", "2024-Q1")
   * - periodType: Type of period (yearly, quarterly, monthly)
   * - Key metrics: revenue, margins, ratios, etc.
   */
  app.get("/api/metrics/:companyId/history", async (req, res) => {
    try {
      const { companyId } = req.params;
      
      // Fetch all financial data for the company
      const allData = await storage.getFinancialData(companyId);
      
      // Calculate metrics for each period
      const historicalMetrics = allData.map(data => {
        const metrics = calculateFinancialMetrics(data);
        return {
          period: data.period,
          periodType: data.periodType,
          revenue: metrics.revenue,
          netProfitMargin: metrics.netProfitMargin,
          operatingCashFlow: metrics.operatingCashFlow,
          grossProfitMargin: metrics.grossProfitMargin,
          currentRatio: metrics.currentRatio,
          roe: metrics.roe,
          roa: metrics.roa,
          debtToEquity: metrics.debtToEquity,
        };
      }).sort((a, b) => {
        // Sort chronologically by period string
        if (a.period < b.period) return -1;
        if (a.period > b.period) return 1;
        return 0;
      });
      
      res.json(historicalMetrics);
    } catch (error) {
      console.error("Error fetching historical metrics:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==========================================================================
  // DEMO USER ROUTE
  // ==========================================================================

  /**
   * GET /api/demo-user
   * 
   * Retrieves the demo user account and their associated companies.
   * Used for testing and demonstration purposes.
   * 
   * @returns {Object} Object containing user and companies array
   */
  app.get("/api/demo-user", async (req, res) => {
    try {
      const demoUser = await storage.getUserByUsername("demo@company.com");
      
      if (!demoUser) {
        return res.status(404).json({ message: "Demo user not found" });
      }
      
      const companies = await storage.getCompaniesByUserId(demoUser.id);
      res.json({ user: demoUser, companies });
    } catch (error) {
      console.error("Error fetching demo user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==========================================================================
  // METRIC ALERTS ROUTES
  // ==========================================================================

  /**
   * GET /api/alerts/:companyId
   * 
   * Retrieves all metric alerts configured for a company.
   * 
   * @param {string} companyId - The company's unique identifier
   * @returns {Array} List of metric alert objects
   */
  app.get("/api/alerts/:companyId", async (req, res) => {
    try {
      const { companyId } = req.params;
      const alerts = await storage.getMetricAlerts(companyId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  /**
   * POST /api/alerts
   * 
   * Creates a new metric alert or updates an existing one.
   * Uses upsert pattern (companyId + metricName unique constraint).
   * 
   * Validates request body against insertMetricAlertSchema.
   * 
   * @body {MetricAlertInsert} Alert configuration object
   * @returns {Object} Created or updated metric alert
   * @throws {400} If validation fails (returns Zod errors)
   */
  app.post("/api/alerts", async (req, res) => {
    try {
      const validatedData = insertMetricAlertSchema.parse(req.body);
      const alert = await storage.createOrUpdateMetricAlert(validatedData);
      res.json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors 
        });
      }
      console.error("Error creating alert:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  /**
   * DELETE /api/alerts/:id
   * 
   * Deletes a metric alert by its ID.
   * 
   * @param {string} id - The alert's unique identifier
   * @returns {Object} Success confirmation
   */
  app.delete("/api/alerts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMetricAlert(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting alert:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==========================================================================
  // SERVER CREATION
  // ==========================================================================

  const httpServer = createServer(app);
  return httpServer;
}

// ============================================================================
// FINANCIAL METRICS CALCULATION
// ============================================================================

/**
 * Calculate Financial Metrics
 * 
 * Computes all 27 financial metrics from raw financial data.
 * Optionally includes period-over-period comparison changes.
 * 
 * @param {any} current - Current period financial data
 * @param {any} [previous=null] - Previous period data for comparison (optional)
 * @returns {Object} Complete metrics object with calculated values
 * 
 * Metric Categories:
 * - Profitability: Gross/Net/Operating margins, ROA, ROE, CAC, EBITDA
 * - Liquidity: Current/Quick ratios, Working Capital, DSO, CCC
 * - Efficiency: Inventory/AR/AP/Asset turnover ratios, LTV
 * - Leverage: Debt-to-Equity, Debt Ratio, Free Cash Flow
 * - Growth: Revenue/Customer/Profit growth percentages
 * 
 * Change Calculations (when previous period provided):
 * - revenueChange: % change in total revenue
 * - netProfitMarginChange: Percentage point change in net profit margin
 * - operatingCashFlowChange: % change in operating cash flow
 * - roeChange: Percentage point change in ROE
 */
function calculateFinancialMetrics(current: any, previous: any = null) {
  
  // ==========================================================================
  // HELPER FUNCTION
  // ==========================================================================
  
  /**
   * Safely parses decimal values from string or number
   * Handles PostgreSQL decimal types returned as strings
   */
  const parseDecimal = (value: string | number): number => {
    return typeof value === 'string' ? parseFloat(value) : value;
  };

  // ==========================================================================
  // EXTRACT CURRENT PERIOD VALUES
  // ==========================================================================
  
  // Income Statement Data
  const revenue = parseDecimal(current.totalRevenue);
  const grossProfit = parseDecimal(current.grossProfit);
  const netIncome = parseDecimal(current.netIncome);
  const operatingIncome = parseDecimal(current.operatingIncome);
  const costOfGoodsSold = parseDecimal(current.costOfGoodsSold);
  const operatingExpenses = parseDecimal(current.operatingExpenses);
  
  // Balance Sheet Data
  const totalAssets = parseDecimal(current.totalAssets);
  const currentAssets = parseDecimal(current.currentAssets);
  const currentLiabilities = parseDecimal(current.currentLiabilities);
  const totalEquity = parseDecimal(current.totalEquity);
  const totalLiabilities = parseDecimal(current.totalLiabilities);
  const inventory = parseDecimal(current.inventory);
  const accountsReceivable = parseDecimal(current.accountsReceivable);
  const accountsPayable = parseDecimal(current.accountsPayable);
  
  // Cash Flow Data
  const operatingCashFlow = parseDecimal(current.operatingCashFlow);
  const investingCashFlow = parseDecimal(current.investingCashFlow);
  
  // Business Metrics
  const marketingSpend = parseDecimal(current.marketingSpend);
  const newCustomers = current.newCustomers;

  // ==========================================================================
  // CALCULATE OPERATING CYCLE METRICS
  // ==========================================================================
  
  // Days Inventory Outstanding: How long inventory sits before being sold
  const dio = costOfGoodsSold > 0 ? (inventory / costOfGoodsSold) * 365 : 0;
  
  // Days Sales Outstanding: Average collection period for receivables
  const dso = revenue > 0 ? (accountsReceivable / revenue) * 365 : 0;
  
  // Days Payable Outstanding: Average payment period to suppliers
  const dpo = costOfGoodsSold > 0 ? (accountsPayable / costOfGoodsSold) * 365 : 0;

  // ==========================================================================
  // CALCULATE CURRENT PERIOD PROFITABILITY METRICS
  // ==========================================================================
  
  const currentMetrics = {
    grossProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
    netProfitMargin: revenue > 0 ? (netIncome / revenue) * 100 : 0,
    operatingMargin: revenue > 0 ? (operatingIncome / revenue) * 100 : 0,
    roe: totalEquity > 0 ? (netIncome / totalEquity) * 100 : 0,
    roa: totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0,
  };

  // ==========================================================================
  // CALCULATE PREVIOUS PERIOD METRICS (for comparison)
  // ==========================================================================
  
  let prevMetrics = null;
  if (previous) {
    const prevRevenue = parseDecimal(previous.totalRevenue);
    const prevGrossProfit = parseDecimal(previous.grossProfit);
    const prevNetIncome = parseDecimal(previous.netIncome);
    const prevOperatingIncome = parseDecimal(previous.operatingIncome);
    const prevTotalEquity = parseDecimal(previous.totalEquity);
    const prevTotalAssets = parseDecimal(previous.totalAssets);

    prevMetrics = {
      grossProfitMargin: prevRevenue > 0 ? (prevGrossProfit / prevRevenue) * 100 : 0,
      netProfitMargin: prevRevenue > 0 ? (prevNetIncome / prevRevenue) * 100 : 0,
      operatingMargin: prevRevenue > 0 ? (prevOperatingIncome / prevRevenue) * 100 : 0,
      roe: prevTotalEquity > 0 ? (prevNetIncome / prevTotalEquity) * 100 : 0,
      roa: prevTotalAssets > 0 ? (prevNetIncome / prevTotalAssets) * 100 : 0,
    };
  }

  // ==========================================================================
  // ASSEMBLE COMPLETE METRICS OBJECT
  // ==========================================================================
  
  const metrics = {
    // ===== Key Performance Overview =====
    revenue: revenue,
    netProfitMargin: currentMetrics.netProfitMargin,
    operatingCashFlow: operatingCashFlow,
    roe: currentMetrics.roe,

    // ===== Profitability Metrics =====
    grossProfitMargin: currentMetrics.grossProfitMargin,
    operatingMargin: currentMetrics.operatingMargin,
    roa: currentMetrics.roa,
    cac: newCustomers > 0 ? marketingSpend / newCustomers : 0,  // Customer Acquisition Cost
    ebitdaMargin: revenue > 0 ? ((operatingIncome) / revenue) * 100 : 0,

    // ===== Liquidity Metrics =====
    currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
    quickRatio: currentLiabilities > 0 ? (currentAssets - inventory) / currentLiabilities : 0,
    workingCapital: currentAssets - currentLiabilities,
    ccc: dio + dso - dpo,  // Cash Conversion Cycle
    dso: dso,  // Days Sales Outstanding

    // ===== Efficiency Metrics =====
    inventoryTurnover: inventory > 0 ? costOfGoodsSold / inventory : 0,
    arTurnover: accountsReceivable > 0 ? revenue / accountsReceivable : 0,
    apTurnover: accountsPayable > 0 ? costOfGoodsSold / accountsPayable : 0,
    assetTurnover: totalAssets > 0 ? revenue / totalAssets : 0,
    ltv: newCustomers > 0 ? revenue / newCustomers * 1.5 : 0,  // Customer Lifetime Value (simplified)

    // ===== Leverage Metrics =====
    debtToEquity: totalEquity > 0 ? totalLiabilities / totalEquity : 0,
    debtRatio: totalAssets > 0 ? totalLiabilities / totalAssets : 0,

    // ===== Cash Flow Metrics =====
    freeCashFlow: operatingCashFlow + investingCashFlow,
    operatingCashFlowRatio: currentLiabilities > 0 ? operatingCashFlow / currentLiabilities : 0,

    // ===== Growth Metrics (requires previous period) =====
    revenueGrowth: previous && parseDecimal(previous.totalRevenue) > 0 
      ? ((revenue - parseDecimal(previous.totalRevenue)) / parseDecimal(previous.totalRevenue)) * 100 
      : 0,
    customerGrowth: previous && previous.totalCustomers > 0 
      ? ((current.totalCustomers - previous.totalCustomers) / previous.totalCustomers) * 100 
      : 0,
    profitGrowth: previous && parseDecimal(previous.netIncome) > 0 
      ? ((netIncome - parseDecimal(previous.netIncome)) / parseDecimal(previous.netIncome)) * 100 
      : 0,
  };

  // ==========================================================================
  // CALCULATE PERIOD-OVER-PERIOD CHANGES
  // ==========================================================================
  
  let changes = {};
  if (previous && prevMetrics) {
    const prevRevenue = parseDecimal(previous.totalRevenue);
    const prevOperatingCashFlow = parseDecimal(previous.operatingCashFlow);

    changes = {
      // Percentage change in revenue
      revenueChange: prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0,
      
      // Percentage point change in net profit margin (not percentage of percentage)
      netProfitMarginChange: currentMetrics.netProfitMargin - prevMetrics.netProfitMargin,
      
      // Percentage change in operating cash flow
      operatingCashFlowChange: prevOperatingCashFlow > 0 
        ? ((operatingCashFlow - prevOperatingCashFlow) / prevOperatingCashFlow) * 100 
        : 0,
      
      // Percentage point change in ROE
      roeChange: currentMetrics.roe - prevMetrics.roe,
    };
  }

  return { ...metrics, changes };
}
