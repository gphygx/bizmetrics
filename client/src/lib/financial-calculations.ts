/**
 * ============================================================================
 * FINANCIAL CALCULATIONS UTILITY
 * ============================================================================
 * 
 * Utility functions for formatting and calculating financial metrics.
 * Provides consistent formatting across the application and reusable
 * calculation formulas for financial analysis.
 * 
 * Contents:
 * - Number Formatting: Currency, percentages, decimals
 * - Status Indicators: Metric health assessment
 * - Trend Analysis: Change direction indicators
 * - Metric Formulas: Financial ratio calculations
 */

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

/**
 * Format Currency
 * 
 * Converts numeric values to USD currency format.
 * Supports compact notation for large values (K for thousands, M for millions).
 * 
 * @param {number} value - The numeric value to format
 * @param {boolean} [compact=false] - Use compact notation (e.g., $1.5M, $250K)
 * @returns {string} Formatted currency string
 * 
 * @example
 * formatCurrency(1500000)        // "$1,500,000"
 * formatCurrency(1500000, true)  // "$1.5M"
 * formatCurrency(2500, true)     // "$3K"
 * formatCurrency(0)              // "$0"
 */
export function formatCurrency(value: number, compact = false): string {
  // Handle zero values
  if (value === 0) return '$0';
  
  // Compact notation for large values
  if (compact && Math.abs(value) >= 1000) {
    if (Math.abs(value) >= 1000000) {
      // Format millions (e.g., $1.5M)
      return `$${(value / 1000000).toFixed(1)}M`;
    } else {
      // Format thousands (e.g., $250K)
      return `$${(value / 1000).toFixed(0)}K`;
    }
  }
  
  // Standard currency formatting with no decimal places
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format Percentage
 * 
 * Converts numeric values to percentage format with customizable decimals.
 * 
 * @param {number} value - The numeric value (already in percentage form, e.g., 25 for 25%)
 * @param {number} [decimals=1] - Number of decimal places to display
 * @returns {string} Formatted percentage string
 * 
 * @example
 * formatPercentage(25.456)        // "25.5%"
 * formatPercentage(25.456, 2)     // "25.46%"
 * formatPercentage(0)             // "0%"
 */
export function formatPercentage(value: number, decimals = 1): string {
  if (value === 0) return '0%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format Number
 * 
 * Formats numeric values with specified decimal places.
 * Used for ratios, multipliers, and counts.
 * 
 * @param {number} value - The numeric value to format
 * @param {number} [decimals=0] - Number of decimal places to display
 * @returns {string} Formatted number string
 * 
 * @example
 * formatNumber(2.456, 2)   // "2.46"
 * formatNumber(1234)       // "1234"
 * formatNumber(0)          // "0"
 */
export function formatNumber(value: number, decimals = 0): string {
  if (value === 0) return '0';
  return value.toFixed(decimals);
}

// ============================================================================
// STATUS ASSESSMENT FUNCTIONS
// ============================================================================

/**
 * Get Metric Status
 * 
 * Determines the health status of a metric by comparing it to a target value.
 * Returns color-coded status for visual indicators (badges, alerts).
 * 
 * @param {number} value - The actual metric value
 * @param {number} target - The target/goal value
 * @param {'higher' | 'lower'} [type='higher'] - Whether higher or lower values are better
 * @returns {'good' | 'warning' | 'danger'} Health status
 * 
 * Status Thresholds:
 * - For "higher" metrics (e.g., revenue, profit margin):
 *   - good: >= 110% of target
 *   - warning: 90-110% of target
 *   - danger: < 90% of target
 * 
 * - For "lower" metrics (e.g., debt ratio, DSO):
 *   - good: <= 90% of target
 *   - warning: 90-110% of target
 *   - danger: > 110% of target
 * 
 * @example
 * getMetricStatus(110, 100, 'higher')  // "good"
 * getMetricStatus(85, 100, 'higher')   // "danger"
 * getMetricStatus(85, 100, 'lower')    // "good"
 */
export function getMetricStatus(
  value: number, 
  target: number, 
  type: 'higher' | 'lower' = 'higher'
): 'good' | 'warning' | 'danger' {
  const ratio = value / target;
  
  if (type === 'higher') {
    // Higher is better (e.g., revenue, margins)
    if (ratio >= 1.1) return 'good';      // 10% above target
    if (ratio >= 0.9) return 'warning';   // Within 10% of target
    return 'danger';                       // More than 10% below target
  } else {
    // Lower is better (e.g., debt ratios, DSO)
    if (ratio <= 0.9) return 'good';      // 10% below target
    if (ratio <= 1.1) return 'warning';   // Within 10% of target
    return 'danger';                       // More than 10% above target
  }
}

/**
 * Get Trend Icon
 * 
 * Determines the direction of change for visual trend indicators.
 * Used to show whether metrics are improving, declining, or stable.
 * 
 * @param {number} [change] - The change value (positive = increase, negative = decrease)
 * @returns {'up' | 'down' | 'neutral'} Trend direction
 * 
 * @example
 * getTrendIcon(5.2)    // "up"     (increase)
 * getTrendIcon(-3.1)   // "down"   (decrease)
 * getTrendIcon(0)      // "neutral" (no change)
 * getTrendIcon()       // "neutral" (undefined)
 */
export function getTrendIcon(change?: number): 'up' | 'down' | 'neutral' {
  // Handle undefined or zero change
  if (!change || change === 0) {
    return 'neutral';
  }
  
  // Positive change = upward trend
  if (change > 0) {
    return 'up';
  }
  
  // Negative change = downward trend
  return 'down';
}

// ============================================================================
// FINANCIAL METRIC CALCULATION FORMULAS
// ============================================================================

/**
 * Financial Metric Formulas
 * 
 * Collection of standardized formulas for calculating financial metrics.
 * Each formula includes zero-division protection and returns 0 for invalid inputs.
 * 
 * Categories:
 * - Profitability: Margins, ROA, ROE
 * - Liquidity: Ratios, working capital
 * - Efficiency: Turnover ratios, operational metrics
 * - Leverage: Debt ratios
 * - Growth: Period-over-period changes
 * - Time-based: Days metrics (DSO, DIO, DPO)
 * - Customer: CAC, LTV
 * 
 * Usage Note:
 * These formulas are primarily for reference and frontend calculations.
 * Backend calculations in routes.ts may use slightly different implementations
 * based on available data fields.
 */
export const MetricFormulas = {
  
  // ==========================================================================
  // PROFITABILITY METRICS
  // ==========================================================================
  
  /**
   * Gross Profit Margin
   * Formula: (Revenue - COGS) / Revenue × 100
   * Measures production efficiency
   */
  grossProfitMargin: (revenue: number, cogs: number) => 
    revenue > 0 ? ((revenue - cogs) / revenue) * 100 : 0,
  
  /**
   * Net Profit Margin
   * Formula: Net Income / Revenue × 100
   * Measures overall profitability
   */
  netProfitMargin: (netIncome: number, revenue: number) => 
    revenue > 0 ? (netIncome / revenue) * 100 : 0,
  
  /**
   * Return on Assets (ROA)
   * Formula: Net Income / Total Assets × 100
   * Measures asset utilization efficiency
   */
  returnOnAssets: (netIncome: number, totalAssets: number) => 
    totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0,
  
  /**
   * Return on Equity (ROE)
   * Formula: Net Income / Shareholders' Equity × 100
   * Measures return to shareholders
   */
  returnOnEquity: (netIncome: number, equity: number) => 
    equity > 0 ? (netIncome / equity) * 100 : 0,
  
  // ==========================================================================
  // LIQUIDITY METRICS
  // ==========================================================================
  
  /**
   * Current Ratio
   * Formula: Current Assets / Current Liabilities
   * Measures short-term liquidity (healthy: > 1.5)
   */
  currentRatio: (currentAssets: number, currentLiabilities: number) => 
    currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
  
  /**
   * Quick Ratio (Acid Test)
   * Formula: (Current Assets - Inventory) / Current Liabilities
   * Measures immediate liquidity without inventory (healthy: > 1.0)
   */
  quickRatio: (currentAssets: number, inventory: number, currentLiabilities: number) => 
    currentLiabilities > 0 ? (currentAssets - inventory) / currentLiabilities : 0,
  
  /**
   * Working Capital
   * Formula: Current Assets - Current Liabilities
   * Measures funds available for operations
   */
  workingCapital: (currentAssets: number, currentLiabilities: number) => 
    currentAssets - currentLiabilities,
  
  // ==========================================================================
  // EFFICIENCY METRICS
  // ==========================================================================
  
  /**
   * Inventory Turnover
   * Formula: COGS / Average Inventory
   * Measures how many times inventory is sold and replaced
   */
  inventoryTurnover: (cogs: number, avgInventory: number) => 
    avgInventory > 0 ? cogs / avgInventory : 0,
  
  /**
   * Accounts Receivable Turnover
   * Formula: Revenue / Average Accounts Receivable
   * Measures collection efficiency
   */
  receivablesTurnover: (revenue: number, avgReceivables: number) => 
    avgReceivables > 0 ? revenue / avgReceivables : 0,
  
  /**
   * Accounts Payable Turnover
   * Formula: COGS / Average Accounts Payable
   * Measures payment speed to suppliers
   */
  payablesTurnover: (cogs: number, avgPayables: number) => 
    avgPayables > 0 ? cogs / avgPayables : 0,
  
  /**
   * Asset Turnover
   * Formula: Revenue / Average Total Assets
   * Measures asset utilization efficiency
   */
  assetTurnover: (revenue: number, avgTotalAssets: number) => 
    avgTotalAssets > 0 ? revenue / avgTotalAssets : 0,
  
  // ==========================================================================
  // LEVERAGE METRICS
  // ==========================================================================
  
  /**
   * Debt-to-Equity Ratio
   * Formula: Total Debt / Total Equity
   * Measures financial leverage (healthy: < 2.0)
   */
  debtToEquityRatio: (totalDebt: number, totalEquity: number) => 
    totalEquity > 0 ? totalDebt / totalEquity : 0,
  
  /**
   * Debt Ratio
   * Formula: Total Debt / Total Assets
   * Measures proportion of assets financed by debt (healthy: < 0.6)
   */
  debtRatio: (totalDebt: number, totalAssets: number) => 
    totalAssets > 0 ? totalDebt / totalAssets : 0,
  
  // ==========================================================================
  // GROWTH METRICS
  // ==========================================================================
  
  /**
   * Revenue Growth
   * Formula: (Current Revenue - Previous Revenue) / Previous Revenue × 100
   * Measures period-over-period revenue growth
   */
  revenueGrowth: (currentRevenue: number, previousRevenue: number) => 
    previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0,
  
  // ==========================================================================
  // TIME-BASED METRICS
  // ==========================================================================
  
  /**
   * Days in Inventory (DIO)
   * Formula: (Average Inventory / COGS) × 365
   * Measures how long inventory sits before being sold
   */
  daysInInventory: (avgInventory: number, cogs: number) => 
    cogs > 0 ? (avgInventory / cogs) * 365 : 0,
  
  /**
   * Days Sales Outstanding (DSO)
   * Formula: (Average Accounts Receivable / Revenue) × 365
   * Measures average collection period (healthy: < 45 days)
   */
  daysSalesOutstanding: (avgReceivables: number, revenue: number) => 
    revenue > 0 ? (avgReceivables / revenue) * 365 : 0,
  
  /**
   * Days Payable Outstanding (DPO)
   * Formula: (Average Accounts Payable / COGS) × 365
   * Measures average payment period to suppliers
   */
  daysPayableOutstanding: (avgPayables: number, cogs: number) => 
    cogs > 0 ? (avgPayables / cogs) * 365 : 0,
  
  /**
   * Cash Conversion Cycle (CCC)
   * Formula: DIO + DSO - DPO
   * Measures time between cash outflow and inflow (healthy: < 60 days)
   */
  cashConversionCycle: (dio: number, dso: number, dpo: number) => 
    dio + dso - dpo,
  
  // ==========================================================================
  // CUSTOMER METRICS
  // ==========================================================================
  
  /**
   * Customer Acquisition Cost (CAC)
   * Formula: Marketing Spend / New Customers
   * Measures cost to acquire each new customer
   */
  customerAcquisitionCost: (marketingSpend: number, newCustomers: number) => 
    newCustomers > 0 ? marketingSpend / newCustomers : 0,
  
  /**
   * Customer Lifetime Value (LTV)
   * Formula: Average Revenue × Customer Lifespan
   * Estimates total revenue from a customer relationship
   */
  customerLifetimeValue: (avgRevenue: number, customerLifespan: number) => 
    avgRevenue * customerLifespan,
};
