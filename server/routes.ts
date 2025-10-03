import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFinancialDataSchema, insertMetricAlertSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get companies for a user
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

  // Get financial data for a company
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

  // Get financial data for specific period
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

  // Create or update financial data
  app.post("/api/financial-data", async (req, res) => {
    try {
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

  // Get calculated financial metrics
  app.get("/api/metrics/:companyId", async (req, res) => {
    try {
      const { companyId } = req.params;
      const { period, comparePeriod } = req.query;
      
      const currentData = await storage.getFinancialDataByPeriod(companyId, period as string || "2024");
      const compareData = (comparePeriod && comparePeriod !== 'none')
        ? await storage.getFinancialDataByPeriod(companyId, comparePeriod as string)
        : null;

      if (!currentData) {
        return res.status(404).json({ message: "Financial data not found" });
      }

      // Calculate all metrics
      const metrics = calculateFinancialMetrics(currentData, compareData);
      res.json(metrics);
    } catch (error) {
      console.error("Error calculating metrics:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get demo user data
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

  // Get historical metrics for charts
  app.get("/api/metrics/:companyId/history", async (req, res) => {
    try {
      const { companyId } = req.params;
      const allData = await storage.getFinancialData(companyId);
      
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

  // Metric Alerts CRUD
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

  app.post("/api/alerts", async (req, res) => {
    try {
      const validatedData = insertMetricAlertSchema.parse(req.body);
      const alert = await storage.createOrUpdateMetricAlert(validatedData);
      res.json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating alert:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

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

  const httpServer = createServer(app);
  return httpServer;
}

function calculateFinancialMetrics(current: any, previous: any = null) {
  const parseDecimal = (value: string | number): number => {
    return typeof value === 'string' ? parseFloat(value) : value;
  };

  // Current period values
  const revenue = parseDecimal(current.totalRevenue);
  const grossProfit = parseDecimal(current.grossProfit);
  const netIncome = parseDecimal(current.netIncome);
  const operatingIncome = parseDecimal(current.operatingIncome);
  const totalAssets = parseDecimal(current.totalAssets);
  const currentAssets = parseDecimal(current.currentAssets);
  const currentLiabilities = parseDecimal(current.currentLiabilities);
  const totalEquity = parseDecimal(current.totalEquity);
  const inventory = parseDecimal(current.inventory);
  const accountsReceivable = parseDecimal(current.accountsReceivable);
  const accountsPayable = parseDecimal(current.accountsPayable);
  const costOfGoodsSold = parseDecimal(current.costOfGoodsSold);
  const operatingCashFlow = parseDecimal(current.operatingCashFlow);
  const investingCashFlow = parseDecimal(current.investingCashFlow);
  const operatingExpenses = parseDecimal(current.operatingExpenses);
  const marketingSpend = parseDecimal(current.marketingSpend);
  const newCustomers = current.newCustomers;
  const totalLiabilities = parseDecimal(current.totalLiabilities);

  // Calculate Days Inventory Outstanding, Days Payable Outstanding
  const dio = costOfGoodsSold > 0 ? (inventory / costOfGoodsSold) * 365 : 0;
  const dso = revenue > 0 ? (accountsReceivable / revenue) * 365 : 0;
  const dpo = costOfGoodsSold > 0 ? (accountsPayable / costOfGoodsSold) * 365 : 0;

  // Current period metrics
  const currentMetrics = {
    grossProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
    netProfitMargin: revenue > 0 ? (netIncome / revenue) * 100 : 0,
    operatingMargin: revenue > 0 ? (operatingIncome / revenue) * 100 : 0,
    roe: totalEquity > 0 ? (netIncome / totalEquity) * 100 : 0,
    roa: totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0,
  };

  // Previous period metrics for comparison
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

  // Calculate all metrics
  const metrics = {
    // Overview metrics
    revenue: revenue,
    netProfitMargin: currentMetrics.netProfitMargin,
    operatingCashFlow: operatingCashFlow,
    roe: currentMetrics.roe,

    // Profitability metrics
    grossProfitMargin: currentMetrics.grossProfitMargin,
    operatingMargin: currentMetrics.operatingMargin,
    roa: currentMetrics.roa,
    cac: newCustomers > 0 ? marketingSpend / newCustomers : 0,
    ebitdaMargin: revenue > 0 ? ((operatingIncome) / revenue) * 100 : 0,

    // Liquidity metrics
    currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
    quickRatio: currentLiabilities > 0 ? (currentAssets - inventory) / currentLiabilities : 0,
    workingCapital: currentAssets - currentLiabilities,
    ccc: dio + dso - dpo,
    dso: dso,

    // Efficiency metrics  
    inventoryTurnover: inventory > 0 ? costOfGoodsSold / inventory : 0,
    arTurnover: accountsReceivable > 0 ? revenue / accountsReceivable : 0,
    apTurnover: accountsPayable > 0 ? costOfGoodsSold / accountsPayable : 0,
    assetTurnover: totalAssets > 0 ? revenue / totalAssets : 0,
    ltv: newCustomers > 0 ? revenue / newCustomers * 1.5 : 0,

    // Leverage metrics
    debtToEquity: totalEquity > 0 ? totalLiabilities / totalEquity : 0,
    debtRatio: totalAssets > 0 ? totalLiabilities / totalAssets : 0,

    // Cash Flow metrics
    freeCashFlow: operatingCashFlow + investingCashFlow,
    operatingCashFlowRatio: currentLiabilities > 0 ? operatingCashFlow / currentLiabilities : 0,

    // Growth metrics (requires previous period)
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

  // Add change calculations if previous period exists
  let changes = {};
  if (previous && prevMetrics) {
    const prevRevenue = parseDecimal(previous.totalRevenue);
    const prevOperatingCashFlow = parseDecimal(previous.operatingCashFlow);

    changes = {
      revenueChange: prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0,
      netProfitMarginChange: currentMetrics.netProfitMargin - prevMetrics.netProfitMargin,
      operatingCashFlowChange: prevOperatingCashFlow > 0 ? ((operatingCashFlow - prevOperatingCashFlow) / prevOperatingCashFlow) * 100 : 0,
      roeChange: currentMetrics.roe - prevMetrics.roe,
    };
  }

  return { ...metrics, changes };
}
