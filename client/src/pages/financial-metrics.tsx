import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { formatCurrency, formatPercentage, formatNumber, getMetricStatus, getTrendIcon } from "@/lib/financial-calculations";

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
  changes?: {
    revenueChange: number;
    netProfitMarginChange: number;
    operatingCashFlowChange: number;
    roeChange: number;
  };
}

export default function FinancialMetrics() {
  const [selectedPeriod, setSelectedPeriod] = useState("2024");
  const [comparePeriod, setComparePeriod] = useState("2023");
  const [companyId, setCompanyId] = useState("");

  // Get demo user and company data
  const { data: demoData, isLoading: demoLoading } = useQuery<any>({
    queryKey: ["/api/demo-user"],
  });

  // Set company ID when demo data loads
  useEffect(() => {
    if (demoData?.companies && demoData.companies.length > 0) {
      setCompanyId(demoData.companies[0].id);
    }
  }, [demoData]);

  // Get financial metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<FinancialMetrics>({
    queryKey: ["/api/metrics", companyId, selectedPeriod, comparePeriod],
    queryFn: async () => {
      const url = `/api/metrics/${companyId}?period=${selectedPeriod}&comparePeriod=${comparePeriod}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch metrics');
      return res.json();
    },
    enabled: !!companyId,
  });

  const isLoading = demoLoading || metricsLoading;

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
    <>
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
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold font-mono text-foreground mt-1" data-testid="text-revenue">
                      {formatCurrency(metrics.revenue)}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-dollar-sign text-primary"></i>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`status-indicator ${metrics.changes?.revenueChange && metrics.changes.revenueChange > 0 ? 'trend-up' : 'trend-down'}`}>
                    {renderTrendIcon(getTrendIcon(metrics.changes?.revenueChange))}
                    <span className="text-sm font-medium">
                      {formatPercentage(Math.abs(metrics.changes?.revenueChange || 0))}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">vs last period</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Net Profit Margin Card */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-net-profit-margin">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Net Profit Margin</p>
                    <p className="text-2xl font-bold font-mono text-foreground mt-1" data-testid="text-net-profit-margin">
                      {formatPercentage(metrics.netProfitMargin)}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-chart-line text-accent"></i>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`status-indicator ${metrics.changes?.netProfitMarginChange && metrics.changes.netProfitMarginChange > 0 ? 'trend-up' : 'trend-down'}`}>
                    {renderTrendIcon(getTrendIcon(metrics.changes?.netProfitMarginChange))}
                    <span className="text-sm font-medium">
                      {metrics.changes?.netProfitMarginChange ? (metrics.changes.netProfitMarginChange > 0 ? '+' : '') + formatPercentage(Math.abs(metrics.changes.netProfitMarginChange)) + ' pts' : '0%'}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">vs last period</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Operating Cash Flow Card */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-operating-cash-flow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Operating Cash Flow</p>
                    <p className="text-2xl font-bold font-mono text-foreground mt-1" data-testid="text-operating-cash-flow">
                      {formatCurrency(metrics.operatingCashFlow)}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-chart-2/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-money-bill-wave text-chart-2"></i>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`status-indicator ${metrics.changes?.operatingCashFlowChange && metrics.changes.operatingCashFlowChange > 0 ? 'trend-up' : 'trend-down'}`}>
                    {renderTrendIcon(getTrendIcon(metrics.changes?.operatingCashFlowChange))}
                    <span className="text-sm font-medium">
                      {formatPercentage(Math.abs(metrics.changes?.operatingCashFlowChange || 0))}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">vs last period</span>
                </div>
              </CardContent>
            </Card>
            
            {/* ROE Card */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-roe">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Return on Equity</p>
                    <p className="text-2xl font-bold font-mono text-foreground mt-1" data-testid="text-roe">
                      {formatPercentage(metrics.roe)}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-chart-3/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-percentage text-chart-3"></i>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`status-indicator ${metrics.changes?.roeChange && metrics.changes.roeChange > 0 ? 'trend-up' : 'trend-down'}`}>
                    {renderTrendIcon(getTrendIcon(metrics.changes?.roeChange))}
                    <span className="text-sm font-medium">
                      {metrics.changes?.roeChange ? (metrics.changes.roeChange > 0 ? '+' : '') + formatPercentage(Math.abs(metrics.changes.roeChange)) + ' pts' : '0%'}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">vs last period</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Profitability Metrics */}
        <section id="profitability">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-dollar-sign text-primary"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Profitability Metrics</h3>
                <p className="text-sm text-muted-foreground">Revenue and profit analysis</p>
              </div>
            </div>
            <Badge className="bg-accent/10 text-accent hover:bg-accent/20" data-testid="status-profitability">
              <i className="fas fa-circle text-xs mr-1"></i>
              Healthy
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Gross Profit Margin */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-gross-profit-margin">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">Gross Profit Margin</p>
                      <i className="fas fa-info-circle text-muted-foreground text-xs cursor-help" title="(Revenue - COGS) / Revenue"></i>
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-gross-profit-margin">
                      {formatPercentage(metrics.grossProfitMargin)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: 40%</span>
                  <span className="status-indicator trend-up">
                    <i className="fas fa-arrow-up text-xs"></i>
                    <span className="text-xs font-medium">+1.8%</span>
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Return on Assets */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-roa">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">Return on Assets</p>
                      <i className="fas fa-info-circle text-muted-foreground text-xs cursor-help" title="Net Income / Total Assets"></i>
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-roa">
                      {formatPercentage(metrics.roa)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: 10%</span>
                  <span className="status-indicator trend-up">
                    <i className="fas fa-arrow-up text-xs"></i>
                    <span className="text-xs font-medium">+1.5%</span>
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Customer Acquisition Cost */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-cac">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">Customer Acquisition Cost</p>
                      <i className="fas fa-info-circle text-muted-foreground text-xs cursor-help" title="Marketing Spend / New Customers"></i>
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-cac">
                      {formatCurrency(metrics.cac)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: $300</span>
                  <span className="status-indicator trend-down">
                    <i className="fas fa-arrow-down text-xs"></i>
                    <span className="text-xs font-medium">-5.0%</span>
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Operating Margin */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-operating-margin">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">Operating Margin</p>
                      <i className="fas fa-info-circle text-muted-foreground text-xs cursor-help" title="Operating Income / Revenue"></i>
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-operating-margin">
                      {formatPercentage(metrics.operatingMargin)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: 15%</span>
                  <span className="status-indicator trend-up">
                    <i className="fas fa-arrow-up text-xs"></i>
                    <span className="text-xs font-medium">+2.3%</span>
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* EBITDA Margin */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-ebitda-margin">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">EBITDA Margin</p>
                      <i className="fas fa-info-circle text-muted-foreground text-xs cursor-help" title="EBITDA / Revenue"></i>
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-ebitda-margin">
                      {formatPercentage(metrics.ebitdaMargin)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: 20%</span>
                  <span className="status-indicator trend-up">
                    <i className="fas fa-arrow-up text-xs"></i>
                    <span className="text-xs font-medium">+1.2%</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Liquidity Metrics */}
        <section id="liquidity">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-chart-2/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-water text-chart-2"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Liquidity Metrics</h3>
                <p className="text-sm text-muted-foreground">Cash and working capital analysis</p>
              </div>
            </div>
            <Badge className="bg-chart-3/10 text-chart-3 hover:bg-chart-3/20" data-testid="status-liquidity">
              <i className="fas fa-circle text-xs mr-1"></i>
              Warning
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Current Ratio */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-current-ratio">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">Current Ratio</p>
                      <i className="fas fa-info-circle text-muted-foreground text-xs cursor-help" title="Current Assets / Current Liabilities"></i>
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-current-ratio">
                      {formatNumber(metrics.currentRatio, 2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Healthy: {'>'}1.5</span>
                  <span className="status-indicator trend-up">
                    <i className="fas fa-arrow-up text-xs"></i>
                    <span className="text-xs font-medium">+0.2</span>
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Ratio */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-quick-ratio">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">Quick Ratio</p>
                      <i className="fas fa-info-circle text-muted-foreground text-xs cursor-help" title="(Current Assets - Inventory) / Current Liabilities"></i>
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-quick-ratio">
                      {formatNumber(metrics.quickRatio, 2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Healthy: {'>'}1.0</span>
                  <span className="status-indicator trend-neutral">
                    <i className="fas fa-minus text-xs"></i>
                    <span className="text-xs font-medium">0.0</span>
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Working Capital */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-working-capital">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">Working Capital</p>
                      <i className="fas fa-info-circle text-muted-foreground text-xs cursor-help" title="Current Assets - Current Liabilities"></i>
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-working-capital">
                      {formatCurrency(metrics.workingCapital, true)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Last month: $580K</span>
                  <span className="status-indicator trend-up">
                    <i className="fas fa-arrow-up text-xs"></i>
                    <span className="text-xs font-medium">+7.8%</span>
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Days Sales Outstanding */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-dso">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">Days Sales Outstanding</p>
                      <i className="fas fa-info-circle text-muted-foreground text-xs cursor-help" title="AR / (Revenue/365)"></i>
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-dso">
                      {formatNumber(metrics.dso, 0)} days
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: {'<'}45 days</span>
                  <span className="status-indicator trend-down">
                    <i className="fas fa-arrow-down text-xs"></i>
                    <span className="text-xs font-medium">-2 days</span>
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Cash Conversion Cycle */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-ccc">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">Cash Conversion Cycle</p>
                      <i className="fas fa-info-circle text-muted-foreground text-xs cursor-help" title="Days Inventory + DSO - Days Payables"></i>
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-ccc">
                      {formatNumber(metrics.ccc, 0)} days
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: {'<'}60 days</span>
                  <span className="status-indicator trend-down">
                    <i className="fas fa-arrow-down text-xs"></i>
                    <span className="text-xs font-medium">-3 days</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Efficiency Metrics */}
        <section id="efficiency">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-chart-5/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-cogs text-chart-5"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Efficiency Metrics</h3>
                <p className="text-sm text-muted-foreground">Asset and operational efficiency</p>
              </div>
            </div>
            <Badge className="bg-accent/10 text-accent hover:bg-accent/20" data-testid="status-efficiency">
              <i className="fas fa-circle text-xs mr-1"></i>
              Good
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Inventory Turnover */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-inventory-turnover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">Inventory Turnover</p>
                      <i className="fas fa-info-circle text-muted-foreground text-xs cursor-help" title="COGS / Average Inventory"></i>
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-inventory-turnover">
                      {formatNumber(metrics.inventoryTurnover, 1)}x
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Industry avg: 6.5x</span>
                  <span className="status-indicator trend-up">
                    <i className="fas fa-arrow-up text-xs"></i>
                    <span className="text-xs font-medium">+0.8x</span>
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Accounts Receivable Turnover */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-ar-turnover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">A/R Turnover</p>
                      <i className="fas fa-info-circle text-muted-foreground text-xs cursor-help" title="Revenue / Average Receivables"></i>
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-ar-turnover">
                      {formatNumber(metrics.arTurnover, 1)}x
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: {'>'}8x</span>
                  <span className="status-indicator trend-up">
                    <i className="fas fa-arrow-up text-xs"></i>
                    <span className="text-xs font-medium">+0.4x</span>
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Customer Lifetime Value */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-ltv">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">Customer Lifetime Value</p>
                      <i className="fas fa-info-circle text-muted-foreground text-xs cursor-help" title="Average Revenue per Customer * Lifespan"></i>
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-ltv">
                      {formatCurrency(metrics.ltv)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">LTV/CAC: {formatNumber(metrics.ltv / metrics.cac, 1)}x</span>
                  <span className="status-indicator trend-up">
                    <i className="fas fa-arrow-up text-xs"></i>
                    <span className="text-xs font-medium">+4.2%</span>
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Accounts Payable Turnover */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-ap-turnover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">A/P Turnover</p>
                      <i className="fas fa-info-circle text-muted-foreground text-xs cursor-help" title="COGS / Average Payables"></i>
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-ap-turnover">
                      {formatNumber(metrics.apTurnover, 1)}x
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Industry avg: 7x</span>
                  <span className="status-indicator trend-neutral">
                    <i className="fas fa-minus text-xs"></i>
                    <span className="text-xs font-medium">0.0x</span>
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Asset Turnover */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-asset-turnover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">Asset Turnover</p>
                      <i className="fas fa-info-circle text-muted-foreground text-xs cursor-help" title="Revenue / Total Assets"></i>
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-asset-turnover">
                      {formatNumber(metrics.assetTurnover, 2)}x
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: {'>'}0.5x</span>
                  <span className="status-indicator trend-up">
                    <i className="fas fa-arrow-up text-xs"></i>
                    <span className="text-xs font-medium">+0.1x</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Leverage Metrics */}
        <section id="leverage">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-chart-4/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-balance-scale text-chart-4"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Leverage Metrics</h3>
                <p className="text-sm text-muted-foreground">Debt and equity ratios</p>
              </div>
            </div>
            <Badge className="bg-accent/10 text-accent hover:bg-accent/20" data-testid="status-leverage">
              <i className="fas fa-circle text-xs mr-1"></i>
              Moderate
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Debt to Equity */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-debt-to-equity">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">Debt to Equity Ratio</p>
                      <i className="fas fa-info-circle text-muted-foreground text-xs cursor-help" title="Total Liabilities / Total Equity"></i>
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-debt-to-equity">
                      {formatNumber(metrics.debtToEquity, 2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Healthy: {'<'}2.0</span>
                  <span className="status-indicator trend-down">
                    <i className="fas fa-arrow-down text-xs"></i>
                    <span className="text-xs font-medium">-0.15</span>
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Debt Ratio */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-debt-ratio">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">Debt Ratio</p>
                      <i className="fas fa-info-circle text-muted-foreground text-xs cursor-help" title="Total Liabilities / Total Assets"></i>
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-debt-ratio">
                      {formatNumber(metrics.debtRatio, 2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Healthy: {'<'}0.6</span>
                  <span className="status-indicator trend-down">
                    <i className="fas fa-arrow-down text-xs"></i>
                    <span className="text-xs font-medium">-0.05</span>
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Free Cash Flow */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-free-cash-flow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">Free Cash Flow</p>
                      <i className="fas fa-info-circle text-muted-foreground text-xs cursor-help" title="Operating + Investing Cash Flow"></i>
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-free-cash-flow">
                      {formatCurrency(metrics.freeCashFlow, true)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Last month: $250K</span>
                  <span className="status-indicator trend-up">
                    <i className="fas fa-arrow-up text-xs"></i>
                    <span className="text-xs font-medium">+8.5%</span>
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Operating Cash Flow Ratio */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-operating-cash-flow-ratio">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">OCF Ratio</p>
                      <i className="fas fa-info-circle text-muted-foreground text-xs cursor-help" title="Operating Cash Flow / Current Liabilities"></i>
                    </div>
                    <p className="text-3xl font-bold font-mono text-foreground" data-testid="text-operating-cash-flow-ratio">
                      {formatNumber(metrics.operatingCashFlowRatio, 2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Target: {'>'}1.0</span>
                  <span className="status-indicator trend-neutral">
                    <i className="fas fa-minus text-xs"></i>
                    <span className="text-xs font-medium">0.0</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Growth Metrics */}
        <section id="growth">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-arrow-trend-up text-accent"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Growth Metrics</h3>
                <p className="text-sm text-muted-foreground">Year-over-year performance</p>
              </div>
            </div>
            <Badge className="bg-accent/10 text-accent hover:bg-accent/20" data-testid="status-growth">
              <i className="fas fa-circle text-xs mr-1"></i>
              Strong
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Revenue Growth */}
            <Card className="metric-card hover:shadow-lg transition-shadow" data-testid="card-revenue-growth">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">Revenue Growth</p>
                      <i className="fas fa-info-circle text-muted-foreground text-xs cursor-help" title="YoY Revenue Change"></i>
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
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">Customer Growth</p>
                      <i className="fas fa-info-circle text-muted-foreground text-xs cursor-help" title="YoY Customer Base Change"></i>
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
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">Profit Growth</p>
                      <i className="fas fa-info-circle text-muted-foreground text-xs cursor-help" title="YoY Net Income Change"></i>
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
    </>
  );
}
