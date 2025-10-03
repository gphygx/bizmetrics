export function formatCurrency(value: number, compact = false): string {
  if (value === 0) return '$0';
  
  if (compact && Math.abs(value) >= 1000) {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else {
      return `$${(value / 1000).toFixed(0)}K`;
    }
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercentage(value: number, decimals = 1): string {
  if (value === 0) return '0%';
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals = 0): string {
  if (value === 0) return '0';
  return value.toFixed(decimals);
}

export function getMetricStatus(value: number, target: number, type: 'higher' | 'lower' = 'higher'): 'good' | 'warning' | 'danger' {
  const ratio = value / target;
  
  if (type === 'higher') {
    if (ratio >= 1.1) return 'good';
    if (ratio >= 0.9) return 'warning';
    return 'danger';
  } else {
    if (ratio <= 0.9) return 'good';
    if (ratio <= 1.1) return 'warning';
    return 'danger';
  }
}

export function getTrendIcon(change?: number): 'up' | 'down' | 'neutral' {
  if (!change || change === 0) {
    return 'neutral';
  }
  if (change > 0) {
    return 'up';
  }
  return 'down';
}

// Financial metric calculation formulas
export const MetricFormulas = {
  // Profitability
  grossProfitMargin: (revenue: number, cogs: number) => revenue > 0 ? ((revenue - cogs) / revenue) * 100 : 0,
  netProfitMargin: (netIncome: number, revenue: number) => revenue > 0 ? (netIncome / revenue) * 100 : 0,
  returnOnAssets: (netIncome: number, totalAssets: number) => totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0,
  returnOnEquity: (netIncome: number, equity: number) => equity > 0 ? (netIncome / equity) * 100 : 0,
  
  // Liquidity
  currentRatio: (currentAssets: number, currentLiabilities: number) => currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
  quickRatio: (currentAssets: number, inventory: number, currentLiabilities: number) => 
    currentLiabilities > 0 ? (currentAssets - inventory) / currentLiabilities : 0,
  workingCapital: (currentAssets: number, currentLiabilities: number) => currentAssets - currentLiabilities,
  
  // Efficiency
  inventoryTurnover: (cogs: number, avgInventory: number) => avgInventory > 0 ? cogs / avgInventory : 0,
  receivablesTurnover: (revenue: number, avgReceivables: number) => avgReceivables > 0 ? revenue / avgReceivables : 0,
  payablesTurnover: (cogs: number, avgPayables: number) => avgPayables > 0 ? cogs / avgPayables : 0,
  assetTurnover: (revenue: number, avgTotalAssets: number) => avgTotalAssets > 0 ? revenue / avgTotalAssets : 0,
  
  // Leverage
  debtToEquityRatio: (totalDebt: number, totalEquity: number) => totalEquity > 0 ? totalDebt / totalEquity : 0,
  debtRatio: (totalDebt: number, totalAssets: number) => totalAssets > 0 ? totalDebt / totalAssets : 0,
  
  // Growth
  revenueGrowth: (currentRevenue: number, previousRevenue: number) => 
    previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0,
  
  // Time-based metrics
  daysInInventory: (avgInventory: number, cogs: number) => cogs > 0 ? (avgInventory / cogs) * 365 : 0,
  daysSalesOutstanding: (avgReceivables: number, revenue: number) => revenue > 0 ? (avgReceivables / revenue) * 365 : 0,
  daysPayableOutstanding: (avgPayables: number, cogs: number) => cogs > 0 ? (avgPayables / cogs) * 365 : 0,
  
  cashConversionCycle: (dio: number, dso: number, dpo: number) => dio + dso - dpo,
  
  // Customer metrics
  customerAcquisitionCost: (marketingSpend: number, newCustomers: number) => newCustomers > 0 ? marketingSpend / newCustomers : 0,
  customerLifetimeValue: (avgRevenue: number, customerLifespan: number) => avgRevenue * customerLifespan,
};
