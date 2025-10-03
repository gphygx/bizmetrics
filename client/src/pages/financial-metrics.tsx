/**
 * ============================================================================
 * FINANCIAL METRICS DASHBOARD
 * ============================================================================
 * 
 * Comprehensive financial metrics tracking and visualization dashboard.
 * Displays 27+ key financial metrics across 5 categories:
 * - Profitability (margins, ROA, CAC, EBITDA)
 * - Liquidity (ratios, working capital, DSO, CCC)
 * - Efficiency (turnover ratios, LTV)
 * - Leverage (debt ratios, free cash flow)
 * - Growth (revenue, customer, profit growth)
 * 
 * Features:
 * - Period-over-period comparison with visual indicators
 * - Interactive historical trend charts using Recharts
 * - Info tooltips with metric definitions
 * - Real-time health status badges
 * - Export functionality (UI only, backend pending)
 */

// ============================================================================
// IMPORTS
// ============================================================================

// Third-party libraries
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Info } from "lucide-react";

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Utility functions and custom components
import { formatCurrency, formatPercentage, formatNumber, getMetricStatus, getTrendIcon } from "@/lib/financial-calculations";
import MetricChart from "@/components/metric-chart";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Financial Metrics Interface
 * 
 * Defines the structure for all financial metrics returned from the API.
 * Contains 27 key financial indicators across multiple categories.
 * 
 * @interface FinancialMetrics
 */
interface FinancialMetrics {
  revenue: number;
  netProfitMargin: number;
  operatingCashFlow: number;
  roe: number;
  grossProfitMargin: number;
  operatingMargin: number;
  roa: number;
  cac: number;
  ebitdaMargin: number;
  currentRatio: number;
  quickRatio: number;
  workingCapital: number;
  dso: number;
  ccc: number;
  inventoryTurnover: number;
  arTurnover: number;
  apTurnover: number;
  assetTurnover: number;
  ltv: number;
  debtToEquity: number;
  debtRatio: number;
  freeCashFlow: number;
  operatingCashFlowRatio: number;
  revenueGrowth: number;
  customerGrowth: number;
  profitGrowth: number;
  // Period-over-period changes (optional, only included when comparison is enabled)
  changes?: {
    revenueChange: number;              // % change in revenue
    netProfitMarginChange: number;      // Percentage point change in net profit margin
    operatingCashFlowChange: number;    // % change in operating cash flow
    roeChange: number;                  // Percentage point change in ROE
  };
}

// ============================================================================
// METRIC DEFINITIONS
// ============================================================================

/**
 * Metric Definitions Dictionary
 * 
 * Contains human-readable definitions for all 27 financial metrics.
 * These definitions are displayed in tooltips when users hover over info icons.
 * 
 * Each definition explains what the metric measures and how it's calculated.
 */
const metricDefinitions: Record<string, string> = {
  "Total Revenue": "The total income generated from sales of goods or services before any expenses are deducted.",
  "Net Profit Margin": "The percentage of revenue remaining after all operating expenses, interest, taxes, and preferred stock dividends have been deducted.",
  "Operating Cash Flow": "Cash generated from normal business operations, indicating the company's ability to generate sufficient positive cash flow to maintain and grow operations.",
  "Return on Equity": "A measure of financial performance calculated by dividing net income by shareholders' equity, showing how effectively management uses equity financing.",
  "Gross Profit Margin": "Revenue minus cost of goods sold, divided by revenue, expressed as a percentage. Shows how efficiently a company produces goods.",
  "Operating Margin": "Operating income divided by revenue, showing the percentage of revenue left after paying for variable costs of production.",
  "Return on Assets": "Net income divided by total assets, measuring how profitable a company is relative to its total assets.",
  "Customer Acquisition Cost": "The average cost to acquire a new customer, including all marketing and sales expenses.",
  "EBITDA Margin": "Earnings before interest, taxes, depreciation and amortization as a percentage of revenue, showing operational profitability.",
  "Current Ratio": "Current assets divided by current liabilities, measuring a company's ability to pay short-term obligations.",
  "Quick Ratio": "Liquid assets divided by current liabilities, a more conservative measure of liquidity that excludes inventory.",
  "Working Capital": "Current assets minus current liabilities, representing the funds available for day-to-day operations.",
  "Days Sales Outstanding": "The average number of days it takes to collect payment after a sale has been made.",
  "Cash Conversion Cycle": "The number of days between paying for raw materials and collecting payment from customers.",
  "Inventory Turnover": "How many times inventory is sold and replaced over a period, indicating efficiency of inventory management.",
  "AR Turnover": "How many times accounts receivable are collected during a period, indicating efficiency of credit and collection policies.",
  "AP Turnover": "How quickly a company pays off its suppliers, calculated by dividing cost of goods sold by average accounts payable.",
  "Asset Turnover": "Revenue divided by total assets, measuring how efficiently a company uses its assets to generate sales.",
  "Customer Lifetime Value": "The total revenue a business can expect from a single customer account throughout their relationship.",
  "Debt to Equity": "Total liabilities divided by shareholders' equity, measuring financial leverage and the degree to which a company is financing its operations with debt.",
  "Debt Ratio": "Total debt divided by total assets, showing what proportion of assets is financed by debt.",
  "Free Cash Flow": "Operating cash flow minus capital expenditures, representing cash available for distribution to investors.",
  "Operating CF Ratio": "Operating cash flow divided by current liabilities, measuring ability to pay short-term obligations with cash from operations.",
  "Revenue Growth": "The percentage increase in revenue compared to the previous period.",
  "Customer Growth": "The percentage increase in customer count compared to the previous period.",
  "Profit Growth": "The percentage increase in net profit compared to the previous period."
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Metric Title Component
 * 
 * Renders a metric title with an info icon tooltip.
 * When users hover over the info icon, a tooltip appears with the metric's definition.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.title - The metric title (e.g., "Total Revenue", "Current Ratio")
 * @returns {JSX.Element} A flex container with the title text and info icon button
 * 
 * @example
 * <MetricTitle title="Total Revenue" />
 */
const MetricTitle = ({ title }: { title: string }) => (
  <div className="flex items-center gap-1.5">
    <p className="text-sm text-muted-foreground">{title}</p>
    <Tooltip>
      <TooltipTrigger asChild>
        <button 
          type="button"
          className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" 
          data-testid={`info-${title.toLowerCase().replace(/\s+/g, '-')}`}
          aria-label={`Information about ${title}`}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-popover text-popover-foreground border border-border">
        <p className="text-sm">{metricDefinitions[title] || "No definition available"}</p>
      </TooltipContent>
    </Tooltip>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Financial Metrics Dashboard Component
 * 
 * Main page component that displays comprehensive financial metrics and analytics.
 * 
 * State Management:
 * - selectedPeriod: Currently selected time period for metrics (e.g., "2024", "2024-Q4")
 * - comparePeriod: Period to compare against (e.g., "2023" for previous year)
 * - companyId: ID of the company whose metrics are being displayed
 * - showCharts: Boolean to toggle historical trends section visibility
 * 
 * Data Fetching:
 * - Fetches demo user/company data on mount
 * - Fetches calculated metrics for selected period with comparison
 * - Lazy-loads historical data only when charts section is expanded
 * 
 * @component
 * @returns {JSX.Element} The complete Financial Metrics Dashboard
 */
export default function FinancialMetrics() {
  
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  
  const [selectedPeriod, setSelectedPeriod] = useState("2024");  // Current period to display
  const [comparePeriod, setComparePeriod] = useState("2023");    // Period for comparison
  const [companyId, setCompanyId] = useState("");                // Active company ID
  const [showCharts, setShowCharts] = useState(false);           // Charts section visibility
  
  // ========================================
  // DATA FETCHING
  // ========================================

  // Get demo user and company data
  const { data: demoData, isLoading: demoLoading } = useQuery<any>({
    queryKey: ["/api/demo-user"],
  });

  // Automatically set company ID when demo data loads
  useEffect(() => {
    if (demoData?.companies && demoData.companies.length > 0) {
      // Use the first company from the demo user
      setCompanyId(demoData.companies[0].id);
    }
  }, [demoData]);

  // Handle scrolling to section based on URL hash
  useEffect(() => {
    const hash = window.location.hash.slice(1); // Remove the # character
    if (hash) {
      // Small delay to ensure page has rendered
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, []);

  /**
   * Fetch calculated financial metrics for the selected period
   * Includes period-over-period comparison when comparePeriod is set
   */
  const { data: metrics, isLoading: metricsLoading } = useQuery<FinancialMetrics>({
    queryKey: ["/api/metrics", companyId, selectedPeriod, comparePeriod],
    queryFn: async () => {
      const url = `/api/metrics/${companyId}?period=${selectedPeriod}&comparePeriod=${comparePeriod}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch metrics');
      return res.json();
    },
    enabled: !!companyId,  // Only fetch when company ID is available
  });

  /**
   * Fetch historical data for trend charts
   * This query is only enabled when:
   * 1. Company ID is available
   * 2. Charts section is expanded (showCharts = true)
   * 
   * This lazy-loading approach improves initial page load performance
   */
  const { data: historyData, isLoading: historyLoading } = useQuery<any[]>({
    queryKey: ["/api/metrics", companyId, "history"],
    queryFn: async () => {
      const url = `/api/metrics/${companyId}/history`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch history');
      return res.json();
    },
    enabled: !!companyId && showCharts,  // Lazy load: only when charts are visible
  });

  // ========================================
  // DERIVED STATE
  // ========================================
  
  const isLoading = demoLoading || metricsLoading;

  // ========================================
  // HELPER FUNCTIONS
  // ========================================
  
  /**
   * Renders a trend indicator icon based on direction
   * 
   * @param {('up'|'down'|'neutral')} trend - The direction of the trend
   * @returns {JSX.Element} FontAwesome icon element
   */
  const renderTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return <i className="fas fa-arrow-up text-xs"></i>;
    if (trend === 'down') return <i className="fas fa-arrow-down text-xs"></i>;
    return <i className="fas fa-minus text-xs"></i>;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <i className="fas fa-exclamation-circle text-4xl text-muted-foreground mb-4"></i>
          <h3 className="text-lg font-semibold text-foreground">No Financial Data Available</h3>
          <p className="text-muted-foreground">Please add financial data to view metrics.</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={0}>
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground" data-testid="page-title">
                Financial Metrics Dashboard
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive KPI tracking and analysis
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Period Selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Period:</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod} data-testid="period-selector">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024-Q4">Q4 2024</SelectItem>
                    <SelectItem value="2024-Q3">Q3 2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Comparison Toggle */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Compare:</label>
                <Select value={comparePeriod} onValueChange={setComparePeriod} data-testid="compare-selector">
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023">Previous Year</SelectItem>
                    <SelectItem value="none">No Comparison</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Export Button */}
              <Button data-testid="button-export">
                <i className="fas fa-download mr-2"></i>
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-8">
        {/* Overview Cards */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4">Key Performance Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Revenue Card */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-revenue">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <MetricTitle title="Total Revenue" />
                    <p className="text-2xl font-bold font-mono text-foreground mt-1" data-testid="text-revenue">
                      {formatCurrency(metrics.revenue)}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-dollar-sign text-primary"></i>
                  </div>
                </div>
                {metrics.changes && comparePeriod !== 'none' && (
                  <div className="flex items-center gap-2">
                    <span className={`status-indicator ${metrics.changes?.revenueChange && metrics.changes.revenueChange > 0 ? 'trend-up' : 'trend-down'}`}>
                      {renderTrendIcon(getTrendIcon(metrics.changes?.revenueChange))}
                      <span className="text-sm font-medium">
                        {formatPercentage(Math.abs(metrics.changes?.revenueChange || 0))}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">vs last period</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Net Profit Margin Card */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-net-profit-margin">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <MetricTitle title="Net Profit Margin" />
                    <p className="text-2xl font-bold font-mono text-foreground mt-1" data-testid="text-net-profit-margin">
                      {formatPercentage(metrics.netProfitMargin)}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-chart-line text-accent"></i>
                  </div>
                </div>
                {metrics.changes && comparePeriod !== 'none' && (
                  <div className="flex items-center gap-2">
                    <span className={`status-indicator ${metrics.changes?.netProfitMarginChange && metrics.changes.netProfitMarginChange > 0 ? 'trend-up' : 'trend-down'}`}>
                      {renderTrendIcon(getTrendIcon(metrics.changes?.netProfitMarginChange))}
                      <span className="text-sm font-medium">
                        {metrics.changes?.netProfitMarginChange ? (metrics.changes.netProfitMarginChange > 0 ? '+' : '') + formatPercentage(Math.abs(metrics.changes.netProfitMarginChange)) + ' pts' : '0%'}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">vs last period</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Operating Cash Flow Card */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-operating-cash-flow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <MetricTitle title="Operating Cash Flow" />
                    <p className="text-2xl font-bold font-mono text-foreground mt-1" data-testid="text-operating-cash-flow">
                      {formatCurrency(metrics.operatingCashFlow)}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-chart-2/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-money-bill-wave text-chart-2"></i>
                  </div>
                </div>
                {metrics.changes && comparePeriod !== 'none' && (
                  <div className="flex items-center gap-2">
                    <span className={`status-indicator ${metrics.changes?.operatingCashFlowChange && metrics.changes.operatingCashFlowChange > 0 ? 'trend-up' : 'trend-down'}`}>
                      {renderTrendIcon(getTrendIcon(metrics.changes?.operatingCashFlowChange))}
                      <span className="text-sm font-medium">
                        {formatPercentage(Math.abs(metrics.changes?.operatingCashFlowChange || 0))}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">vs last period</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* ROE Card */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-roe">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <MetricTitle title="Return on Equity" />
                    <p className="text-2xl font-bold font-mono text-foreground mt-1" data-testid="text-roe">
                      {formatPercentage(metrics.roe)}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-chart-3/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-percentage text-chart-3"></i>
                  </div>
                </div>
                {metrics.changes && comparePeriod !== 'none' && (
                  <div className="flex items-center gap-2">
                    <span className={`status-indicator ${metrics.changes?.roeChange && metrics.changes.roeChange > 0 ? 'trend-up' : 'trend-down'}`}>
                      {renderTrendIcon(getTrendIcon(metrics.changes?.roeChange))}
                      <span className="text-sm font-medium">
                        {metrics.changes?.roeChange ? (metrics.changes.roeChange > 0 ? '+' : '') + formatPercentage(Math.abs(metrics.changes.roeChange)) + ' pts' : '0%'}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">vs last period</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Historical Trends Section */}
        <Collapsible open={showCharts} onOpenChange={setShowCharts}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between mb-6"
              data-testid="button-toggle-charts"
            >
              <span className="flex items-center gap-2">
                <i className="fas fa-chart-line"></i>
                <span>Historical Trends & Charts</span>
              </span>
              <i className={`fas fa-chevron-${showCharts ? 'up' : 'down'}`}></i>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mb-8">
            {historyLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-[280px]" />
                ))}
              </div>
            ) : historyData && historyData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MetricChart 
                  title="Revenue Trend"
                  data={historyData.map(d => ({ period: d.period, value: d.revenue }))}
                  formatValue={formatCurrency}
                  color="hsl(var(--primary))"
                />
                <MetricChart 
                  title="Net Profit Margin"
                  data={historyData.map(d => ({ period: d.period, value: d.netProfitMargin }))}
                  formatValue={formatPercentage}
                  color="hsl(var(--chart-1))"
                />
                <MetricChart 
                  title="Operating Cash Flow"
                  data={historyData.map(d => ({ period: d.period, value: d.operatingCashFlow }))}
                  formatValue={formatCurrency}
                  color="hsl(var(--chart-2))"
                />
                <MetricChart 
                  title="Return on Equity"
                  data={historyData.map(d => ({ period: d.period, value: d.roe }))}
                  formatValue={formatPercentage}
                  color="hsl(var(--chart-3))"
                />
                <MetricChart 
                  title="Current Ratio"
                  data={historyData.map(d => ({ period: d.period, value: d.currentRatio }))}
                  formatValue={(v) => v.toFixed(2)}
                  color="hsl(var(--chart-4))"
                />
                <MetricChart 
                  title="Debt-to-Equity Ratio"
                  data={historyData.map(d => ({ period: d.period, value: d.debtToEquity }))}
                  formatValue={(v) => v.toFixed(2)}
                  color="hsl(var(--chart-5))"
                />
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <i className="fas fa-chart-line text-4xl text-muted-foreground mb-3"></i>
                  <p className="text-muted-foreground">No historical data available</p>
                </CardContent>
              </Card>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Profitability Metrics */}
        <section id="profitability">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-dollar-sign text-primary"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Profitability Metrics</h3>
              <p className="text-sm text-muted-foreground">Revenue and profit analysis</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Gross Profit Margin */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-gross-profit-margin">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <MetricTitle title="Gross Profit Margin" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-gross-profit-margin">
                      {formatPercentage(metrics.grossProfitMargin)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: 40%</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${metrics.grossProfitMargin >= 40 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'}`}>
                    {metrics.grossProfitMargin >= 40 ? 'Healthy' : 'Warning'}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Return on Assets */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-roa">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <MetricTitle title="Return on Assets" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-roa">
                      {formatPercentage(metrics.roa)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: 10%</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${metrics.roa >= 10 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'}`}>
                    {metrics.roa >= 10 ? 'Healthy' : 'Warning'}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Customer Acquisition Cost */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-cac">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <MetricTitle title="Customer Acquisition Cost" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-cac">
                      {formatCurrency(metrics.cac)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: $300</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${metrics.cac <= 300 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'}`}>
                    {metrics.cac <= 300 ? 'Healthy' : 'Warning'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Operating Margin */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-operating-margin">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <MetricTitle title="Operating Margin" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-operating-margin">
                      {formatPercentage(metrics.operatingMargin)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: 15%</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${metrics.operatingMargin >= 15 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'}`}>
                    {metrics.operatingMargin >= 15 ? 'Healthy' : 'Warning'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* EBITDA Margin */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-ebitda-margin">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <MetricTitle title="EBITDA Margin" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-ebitda-margin">
                      {formatPercentage(metrics.ebitdaMargin)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: 20%</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${metrics.ebitdaMargin >= 20 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'}`}>
                    {metrics.ebitdaMargin >= 20 ? 'Healthy' : 'Warning'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Liquidity Metrics */}
        <section id="liquidity">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-chart-2/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-water text-chart-2"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Liquidity Metrics</h3>
              <p className="text-sm text-muted-foreground">Cash and working capital analysis</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Current Ratio */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-current-ratio">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <MetricTitle title="Current Ratio" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-current-ratio">
                      {formatNumber(metrics.currentRatio, 2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Healthy: {'>'}1.5</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${metrics.currentRatio > 1.5 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'}`}>
                    {metrics.currentRatio > 1.5 ? 'Healthy' : 'Warning'}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Ratio */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-quick-ratio">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <MetricTitle title="Quick Ratio" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-quick-ratio">
                      {formatNumber(metrics.quickRatio, 2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Healthy: {'>'}1.0</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${metrics.quickRatio > 1.0 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'}`}>
                    {metrics.quickRatio > 1.0 ? 'Healthy' : 'Warning'}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Working Capital */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-working-capital">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <MetricTitle title="Working Capital" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-working-capital">
                      {formatCurrency(metrics.workingCapital, true)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Positive required</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${metrics.workingCapital > 0 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'}`}>
                    {metrics.workingCapital > 0 ? 'Healthy' : 'Warning'}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Days Sales Outstanding */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-dso">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <MetricTitle title="Days Sales Outstanding" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-dso">
                      {formatNumber(metrics.dso, 0)} days
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: {'<'}45 days</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${metrics.dso < 45 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'}`}>
                    {metrics.dso < 45 ? 'Healthy' : 'Warning'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Cash Conversion Cycle */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-ccc">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <MetricTitle title="Cash Conversion Cycle" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-ccc">
                      {formatNumber(metrics.ccc, 0)} days
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: {'<'}60 days</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${metrics.ccc < 60 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'}`}>
                    {metrics.ccc < 60 ? 'Healthy' : 'Warning'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Efficiency Metrics */}
        <section id="efficiency">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-chart-5/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-cogs text-chart-5"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Efficiency Metrics</h3>
              <p className="text-sm text-muted-foreground">Asset and operational efficiency</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Inventory Turnover */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-inventory-turnover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <MetricTitle title="Inventory Turnover" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-inventory-turnover">
                      {formatNumber(metrics.inventoryTurnover, 1)}x
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Industry avg: 6.5x</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${metrics.inventoryTurnover >= 6.5 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'}`}>
                    {metrics.inventoryTurnover >= 6.5 ? 'Healthy' : 'Warning'}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Accounts Receivable Turnover */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-ar-turnover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <MetricTitle title="AR Turnover" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-ar-turnover">
                      {formatNumber(metrics.arTurnover, 1)}x
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: {'>'}8x</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${metrics.arTurnover > 8 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'}`}>
                    {metrics.arTurnover > 8 ? 'Healthy' : 'Warning'}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Customer Lifetime Value */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-ltv">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <MetricTitle title="Customer Lifetime Value" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-ltv">
                      {formatCurrency(metrics.ltv)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">LTV/CAC: {formatNumber(metrics.ltv / metrics.cac, 1)}x</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${(metrics.ltv / metrics.cac) > 3 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'}`}>
                    {(metrics.ltv / metrics.cac) > 3 ? 'Healthy' : 'Warning'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Accounts Payable Turnover */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-ap-turnover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <MetricTitle title="AP Turnover" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-ap-turnover">
                      {formatNumber(metrics.apTurnover, 1)}x
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Industry avg: 7x</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${metrics.apTurnover >= 7 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'}`}>
                    {metrics.apTurnover >= 7 ? 'Healthy' : 'Warning'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Asset Turnover */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-asset-turnover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <MetricTitle title="Asset Turnover" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-asset-turnover">
                      {formatNumber(metrics.assetTurnover, 2)}x
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: {'>'}0.5x</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${metrics.assetTurnover > 0.5 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'}`}>
                    {metrics.assetTurnover > 0.5 ? 'Healthy' : 'Warning'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Leverage Metrics */}
        <section id="leverage">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-chart-4/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-balance-scale text-chart-4"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Leverage Metrics</h3>
              <p className="text-sm text-muted-foreground">Debt and equity ratios</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Debt to Equity */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-debt-to-equity">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <MetricTitle title="Debt to Equity" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-debt-to-equity">
                      {formatNumber(metrics.debtToEquity, 2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Healthy: {'<'}2.0</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${metrics.debtToEquity < 2.0 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'}`}>
                    {metrics.debtToEquity < 2.0 ? 'Healthy' : 'Warning'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Debt Ratio */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-debt-ratio">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <MetricTitle title="Debt Ratio" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-debt-ratio">
                      {formatNumber(metrics.debtRatio, 2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Healthy: {'<'}0.6</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${metrics.debtRatio < 0.6 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'}`}>
                    {metrics.debtRatio < 0.6 ? 'Healthy' : 'Warning'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Free Cash Flow */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-free-cash-flow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <MetricTitle title="Free Cash Flow" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-free-cash-flow">
                      {formatCurrency(metrics.freeCashFlow, true)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Positive required</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${metrics.freeCashFlow > 0 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'}`}>
                    {metrics.freeCashFlow > 0 ? 'Healthy' : 'Warning'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Operating Cash Flow Ratio */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-operating-cash-flow-ratio">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <MetricTitle title="Operating CF Ratio" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-operating-cash-flow-ratio">
                      {formatNumber(metrics.operatingCashFlowRatio, 2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: {'>'}1.0</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${metrics.operatingCashFlowRatio > 1.0 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'}`}>
                    {metrics.operatingCashFlowRatio > 1.0 ? 'Healthy' : 'Warning'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Growth Metrics */}
        <section id="growth">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-arrow-trend-up text-accent"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Growth Metrics</h3>
              <p className="text-sm text-muted-foreground">Year-over-year performance</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Revenue Growth */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-revenue-growth">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <MetricTitle title="Revenue Growth" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-revenue-growth">
                      {metrics.revenueGrowth > 0 ? '+' : ''}{formatPercentage(metrics.revenueGrowth)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: 15%</span>
                  <span className={`status-indicator ${metrics.revenueGrowth > 0 ? 'trend-up' : 'trend-down'}`}>
                    {renderTrendIcon(getTrendIcon(metrics.revenueGrowth))}
                    <span className="text-xs font-medium">{formatPercentage(Math.abs(metrics.revenueGrowth))}</span>
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Customer Growth */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-customer-growth">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <MetricTitle title="Customer Growth" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-customer-growth">
                      {metrics.customerGrowth > 0 ? '+' : ''}{formatPercentage(metrics.customerGrowth)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: 20%</span>
                  <span className={`status-indicator ${metrics.customerGrowth > 0 ? 'trend-up' : 'trend-down'}`}>
                    {renderTrendIcon(getTrendIcon(metrics.customerGrowth))}
                    <span className="text-xs font-medium">{formatPercentage(Math.abs(metrics.customerGrowth))}</span>
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Profit Growth */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-profit-growth">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <MetricTitle title="Profit Growth" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-profit-growth">
                      {metrics.profitGrowth > 0 ? '+' : ''}{formatPercentage(metrics.profitGrowth)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: 18%</span>
                  <span className={`status-indicator ${metrics.profitGrowth > 0 ? 'trend-up' : 'trend-down'}`}>
                    {renderTrendIcon(getTrendIcon(metrics.profitGrowth))}
                    <span className="text-xs font-medium">{formatPercentage(Math.abs(metrics.profitGrowth))}</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Summary Section */}
        <section data-testid="section-key-insights">
          <Card className="bg-muted/30">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4" data-testid="heading-key-insights">Key Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3" data-testid="insight-card-profitability">
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-check text-accent"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Strong Profitability</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Gross profit margin of {formatPercentage(metrics.grossProfitMargin)} exceeds industry standards
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3" data-testid="insight-card-liquidity">
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-check text-accent"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Healthy Liquidity</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Quick ratio of {formatNumber(metrics.quickRatio, 2)} indicates strong short-term solvency
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3" data-testid="insight-card-revenue">
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-check text-accent"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Revenue Momentum</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      YoY revenue growth of {formatPercentage(metrics.revenueGrowth)} demonstrates market expansion
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3" data-testid="insight-card-dso">
                  <div className="w-8 h-8 bg-chart-3/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-exclamation text-chart-3"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Watch DSO</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Days sales outstanding at {formatNumber(metrics.dso, 0)} days - monitor collection efficiency
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </TooltipProvider>
  );
}
