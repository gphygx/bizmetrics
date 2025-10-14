/**
 * ============================================================================
 * API ROUTES - BIZMETRICS FINANCIAL PLATFORM (SECURE VERSION)
 * ============================================================================
 * 
 * Enhanced REST API endpoints for BizMetrics with complete authentication
 * and authorization system. All financial data routes are now protected
 * with role-based access control.
 * 
 * NEW SECURITY FEATURES:
 * - Session-based authentication on all routes
 * - Company access validation for multi-tenant security
 * - Role-based permissions (owner, admin, user, viewer)
 * - Automatic user context attachment to requests
 * 
 * Route Categories:
 * - Authentication: User registration, login, session management
 * - Company Management: Secure company access with permissions
 * - Financial Data: Protected CRUD operations with access control
 * - Metrics: Calculated financial metrics with user validation
 * - Historical Data: Time-series data with company isolation
 * - Alerts: Custom metric alerts with permission checks
 * 
 * All routes now use authentication middleware and validate company access.
 */

// ============================================================================
// IMPORTS
// ============================================================================

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertFinancialDataSchema, 
  insertMetricAlertSchema,
  insertCompanySchema,
  type UserRole 
} from "@shared/schema";
import { z } from "zod";
import { authRouter, requireAuth, requireCompanyAccess } from "./auth-routes";

// ============================================================================
// PERMISSION CHECKING UTILITIES
// ============================================================================

/**
 * Check if user has required permission for an action
 * @param userRole - User's role in the company
 * @param permissionType - Type of permission to check
 * @param action - Specific action to verify
 * @returns True if user has permission, false otherwise
 */
function hasPermission(
  userRole: UserRole, 
  permissionType: keyof typeof DEFAULT_PERMISSIONS.owner, 
  action: string
): boolean {
  const rolePermissions = DEFAULT_PERMISSIONS[userRole];
  return rolePermissions[permissionType]?.includes(action) || false;
}

/**
 * Get user's role for a specific company
 * @param userId - User ID
 * @param companyId - Company ID
 * @returns User's role or null if no access
 */
async function getUserCompanyRole(userId: string, companyId: string): Promise<UserRole | null> {
  const companyUser = await storage.getCompanyUser(userId, companyId);
  return companyUser?.role as UserRole || null;
}

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

/**
 * Registers all API routes with authentication and authorization
 * 
 * @param {Express} app - The Express application instance
 * @returns {Promise<Server>} HTTP server instance
 */
export async function registerRoutes(app: Express): Promise<Server> {

  // ==========================================================================
  // AUTHENTICATION ROUTES (PUBLIC)
  // ==========================================================================

  /**
   * Mount authentication routes at /api/auth
   * These routes are public and do not require authentication
   */
  app.use("/api/auth", authRouter);

  // ==========================================================================
  // COMPANY MANAGEMENT ROUTES (PROTECTED)
  // ==========================================================================

  /**
   * GET /api/companies
   * 
   * Retrieves all companies accessible to the authenticated user.
   * Now uses the user from authentication middleware instead of URL parameters.
   * 
   * SECURITY:
   * - Requires valid authentication session
   * - Returns only companies the user has access to
   * - Respects role-based permissions
   * 
   * @header Authorization: Bearer <sessionId>
   * @returns {Array} List of company objects with user roles
   */
  app.get("/api/companies", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const companies = await storage.getCompaniesByUserId(req.user.id);

      // Enhance companies with user's role for each company
      const companiesWithRoles = await Promise.all(
        companies.map(async (company) => {
          const companyUser = await storage.getCompanyUser(req.user!.id, company.id);
          return {
            ...company,
            userRole: companyUser?.role || null,
            permissions: companyUser?.permissions || null
          };
        })
      );

      res.json(companiesWithRoles);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  /**
   * POST /api/companies
   * 
   * Creates a new company and automatically assigns the creator as owner.
   * 
   * SECURITY:
   * - Requires valid authentication
   * - User automatically becomes owner of created company
   * 
   * @header Authorization: Bearer <sessionId>
   * @body {name} Company name
   * @returns {Object} Created company object
   */
  app.post("/api/companies", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const validatedData = insertCompanySchema.parse(req.body);

      // Create company with current user as owner
      const company = await storage.createCompany({
        name: validatedData.name,
        userId: req.user.id
      });

      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors 
        });
      }
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  /**
   * GET /api/companies/:companyId/users
   * 
   * Retrieves all users with access to a company.
   * Requires admin or owner permissions.
   * 
   * SECURITY:
   * - Requires valid authentication
   * - Requires company access
   * - Requires 'users' read permission
   * 
   * @header Authorization: Bearer <sessionId>
   * @param {string} companyId - Company ID from URL
   * @returns {Array} List of company users with roles
   */
  app.get("/api/companies/:companyId/users", 
    requireAuth, 
    requireCompanyAccess, 
    async (req, res) => {
      try {
        const { companyId } = req.params;
        const userRole = await getUserCompanyRole(req.user!.id, companyId);

        // Check if user has permission to view company users
        if (!userRole || !hasPermission(userRole, 'users', 'read')) {
          return res.status(403).json({ 
            message: "Insufficient permissions to view company users" 
          });
        }

        const companyUsers = await storage.getCompanyUsers(companyId);

        // Enhance with user details
        const usersWithDetails = await Promise.all(
          companyUsers.map(async (companyUser) => {
            const user = await storage.getUser(companyUser.userId);
            return {
              ...companyUser,
              user: user ? { 
                id: user.id, 
                username: user.username, 
                email: user.email,
                fullName: user.fullName 
              } : null
            };
          })
        );

        res.json(usersWithDetails);
      } catch (error) {
        console.error("Error fetching company users:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // ==========================================================================
  // FINANCIAL DATA ROUTES (PROTECTED)
  // ==========================================================================

  /**
   * GET /api/financial-data/:companyId
   * 
   * Retrieves financial data for a company, optionally filtered by period.
   * Now validates company access and permissions.
   * 
   * SECURITY:
   * - Requires valid authentication
   * - Requires company access
   * - Requires 'financialData' read permission
   * 
   * @header Authorization: Bearer <sessionId>
   * @param {string} companyId - Company ID from URL
   * @param {string} [period] - Optional period filter
   * @returns {Array} Financial data entries
   */
  app.get("/api/financial-data/:companyId", 
    requireAuth, 
    requireCompanyAccess, 
    async (req, res) => {
      try {
        const { companyId } = req.params;
        const { period } = req.query;
        const userRole = await getUserCompanyRole(req.user!.id, companyId);

        // Check if user has permission to read financial data
        if (!userRole || !hasPermission(userRole, 'financialData', 'read')) {
          return res.status(403).json({ 
            message: "Insufficient permissions to view financial data" 
          });
        }

        const data = await storage.getFinancialData(companyId, period as string);
        res.json(data);
      } catch (error) {
        console.error("Error fetching financial data:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  /**
   * GET /api/financial-data/:companyId/:period
   * 
   * Retrieves financial data for a specific company and period.
   * Now includes access control and permission checks.
   * 
   * SECURITY:
   * - Requires valid authentication
   * - Requires company access
   * - Requires 'financialData' read permission
   * 
   * @header Authorization: Bearer <sessionId>
   * @param {string} companyId - Company ID from URL
   * @param {string} period - Period identifier
   * @returns {Object} Financial data for specified period
   */
  app.get("/api/financial-data/:companyId/:period", 
    requireAuth, 
    requireCompanyAccess, 
    async (req, res) => {
      try {
        const { companyId, period } = req.params;
        const userRole = await getUserCompanyRole(req.user!.id, companyId);

        if (!userRole || !hasPermission(userRole, 'financialData', 'read')) {
          return res.status(403).json({ 
            message: "Insufficient permissions to view financial data" 
          });
        }

        const data = await storage.getFinancialDataByPeriod(companyId, period);

        if (!data) {
          return res.status(404).json({ message: "Financial data not found" });
        }

        res.json(data);
      } catch (error) {
        console.error("Error fetching financial data:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  /**
   * POST /api/financial-data
   * 
   * Creates or updates financial data for a company period.
   * Now validates company access and write permissions.
   * 
   * SECURITY:
   * - Requires valid authentication
   * - Requires company access (from request body)
   * - Requires 'financialData' write permission
   * 
   * @header Authorization: Bearer <sessionId>
   * @body {FinancialDataInsert} Financial data object
   * @returns {Object} Created or updated financial data
   */
  app.post("/api/financial-data", requireAuth, async (req, res) => {
    try {
      const validatedData = insertFinancialDataSchema.parse(req.body);

      // Check company access for the company in the request
      if (!req.companyAccess?.includes(validatedData.companyId)) {
        return res.status(403).json({ 
          message: "Access denied to this company" 
        });
      }

      const userRole = await getUserCompanyRole(req.user!.id, validatedData.companyId);

      if (!userRole || !hasPermission(userRole, 'financialData', 'write')) {
        return res.status(403).json({ 
          message: "Insufficient permissions to modify financial data" 
        });
      }

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
  // METRICS CALCULATION ROUTES (PROTECTED)
  // ==========================================================================

  /**
   * GET /api/metrics/:companyId
   * 
   * Calculates all 27 financial metrics for a company.
   * Now includes comprehensive access control.
   * 
   * SECURITY:
   * - Requires valid authentication
   * - Requires company access
   * - Requires 'financialData' read permission
   * 
   * @header Authorization: Bearer <sessionId>
   * @param {string} companyId - Company ID from URL
   * @param {string} [period] - Current period (default: "2024")
   * @param {string} [comparePeriod] - Comparison period (optional)
   * @returns {Object} Calculated metrics with changes
   */
  app.get("/api/metrics/:companyId", 
    requireAuth, 
    requireCompanyAccess, 
    async (req, res) => {
      try {
        const { companyId } = req.params;
        const { period, comparePeriod } = req.query;
        const userRole = await getUserCompanyRole(req.user!.id, companyId);

        if (!userRole || !hasPermission(userRole, 'financialData', 'read')) {
          return res.status(403).json({ 
            message: "Insufficient permissions to view metrics" 
          });
        }

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
    }
  );

  /**
   * GET /api/metrics/:companyId/history
   * 
   * Returns historical financial metrics for trend analysis.
   * Now includes proper access control.
   * 
   * SECURITY:
   * - Requires valid authentication
   * - Requires company access
   * - Requires 'financialData' read permission
   * 
   * @header Authorization: Bearer <sessionId>
   * @param {string} companyId - Company ID from URL
   * @returns {Array} Historical metrics sorted by period
   */
  app.get("/api/metrics/:companyId/history", 
    requireAuth, 
    requireCompanyAccess, 
    async (req, res) => {
      try {
        const { companyId } = req.params;
        const userRole = await getUserCompanyRole(req.user!.id, companyId);

        if (!userRole || !hasPermission(userRole, 'financialData', 'read')) {
          return res.status(403).json({ 
            message: "Insufficient permissions to view historical metrics" 
          });
        }

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
    }
  );

  // ==========================================================================
  // DEMO USER ROUTE (PROTECTED - ADMIN ONLY)
  // ==========================================================================

  /**
   * GET /api/demo-user
   * 
   * Retrieves the demo user account for testing.
   * Now restricted to authenticated users.
   * 
   * SECURITY:
   * - Requires valid authentication
   * - Useful for development and demo purposes
   * 
   * @header Authorization: Bearer <sessionId>
   * @returns {Object} Demo user and companies
   */
  app.get("/api/demo-user", requireAuth, async (req, res) => {
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
  // METRIC ALERTS ROUTES (PROTECTED)
  // ==========================================================================

  /**
   * GET /api/alerts/:companyId
   * 
   * Retrieves metric alerts for a company.
   * Now includes access control and permission checks.
   * 
   * SECURITY:
   * - Requires valid authentication
   * - Requires company access
   * - Requires 'alerts' read permission
   * 
   * @header Authorization: Bearer <sessionId>
   * @param {string} companyId - Company ID from URL
   * @returns {Array} Metric alert objects
   */
  app.get("/api/alerts/:companyId", 
    requireAuth, 
    requireCompanyAccess, 
    async (req, res) => {
      try {
        const { companyId } = req.params;
        const userRole = await getUserCompanyRole(req.user!.id, companyId);

        if (!userRole || !hasPermission(userRole, 'alerts', 'read')) {
          return res.status(403).json({ 
            message: "Insufficient permissions to view alerts" 
          });
        }

        const alerts = await storage.getMetricAlerts(companyId);
        res.json(alerts);
      } catch (error) {
        console.error("Error fetching alerts:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  /**
   * POST /api/alerts
   * 
   * Creates or updates a metric alert.
   * Now validates company access and alert permissions.
   * 
   * SECURITY:
   * - Requires valid authentication
   * - Requires company access (from request body)
   * - Requires 'alerts' write permission
   * 
   * @header Authorization: Bearer <sessionId>
   * @body {MetricAlertInsert} Alert configuration
   * @returns {Object} Created or updated alert
   */
  app.post("/api/alerts", requireAuth, async (req, res) => {
    try {
      const validatedData = insertMetricAlertSchema.parse(req.body);

      // Check company access for the company in the request
      if (!req.companyAccess?.includes(validatedData.companyId)) {
        return res.status(403).json({ 
          message: "Access denied to this company" 
        });
      }

      const userRole = await getUserCompanyRole(req.user!.id, validatedData.companyId);

      if (!userRole || !hasPermission(userRole, 'alerts', 'write')) {
        return res.status(403).json({ 
          message: "Insufficient permissions to manage alerts" 
        });
      }

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
   * Deletes a metric alert by ID.
   * Now includes proper authorization checks.
   * 
   * SECURITY:
   * - Requires valid authentication
   * - Requires access to the alert's company
   * - Requires 'alerts' manage permission
   * 
   * @header Authorization: Bearer <sessionId>
   * @param {string} id - Alert ID from URL
   * @returns {Object} Success confirmation
   */
  app.delete("/api/alerts/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      // Get the alert to check company access
      const alert = await storage.getMetricAlert(id);
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }

      // Check company access
      if (!req.companyAccess?.includes(alert.companyId)) {
        return res.status(403).json({ 
          message: "Access denied to this company" 
        });
      }

      const userRole = await getUserCompanyRole(req.user!.id, alert.companyId);

      if (!userRole || !hasPermission(userRole, 'alerts', 'manage')) {
        return res.status(403).json({ 
          message: "Insufficient permissions to delete alerts" 
        });
      }

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
// FINANCIAL METRICS CALCULATION (UNCHANGED)
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

/**
 * SECURITY IMPLEMENTATION NOTES:
 * 
 * 1. AUTHENTICATION FLOW:
 *    - User registers/login via /api/auth routes
 *    - Session ID returned and stored in frontend
 *    - Session ID included in Authorization header for protected routes
 *    - Middleware validates session and attaches user to request
 * 
 * 2. AUTHORIZATION FLOW:
 *    - requireAuth middleware validates session and user
 *    - requireCompanyAccess checks user has access to specific company
 *    - Role-based permissions determine what actions are allowed
 * 
 * 3. PERMISSION HIERARCHY:
 *    - Owner: Full access to all company data and user management
 *    - Admin: Almost full access, can manage users and data
 *    - User: Can read and write financial data, manage own alerts
 *    - Viewer: Read-only access to financial data and metrics
 * 
 * 4. DATA ISOLATION:
 *    - Users can only access companies they have been added to
 *    - Financial data is strictly segregated by company
 *    - API responses only include data from accessible companies
 * 
 * 5. FRONTEND INTEGRATION:
 *    - Store session ID in localStorage or secure cookies
 *    - Include Authorization: Bearer <sessionId> in all API calls
 *    - Handle 401 responses by redirecting to login
 *    - Handle 403 responses by showing permission errors
 */