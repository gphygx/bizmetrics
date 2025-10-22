import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { insertFinancialDataSchema, type InsertFinancialData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Save, Calculator, Database, FileSpreadsheet } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/financial-calculations";

interface Company {
  id: string;
  name: string;
}

export default function Worksheet() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saveToDatabase, setSaveToDatabase] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  // Fetch companies for the logged-in user
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies", user?.id],
    enabled: !!user?.id,
  });

  const form = useForm<InsertFinancialData>({
    resolver: zodResolver(insertFinancialDataSchema),
    defaultValues: {
      companyId: "",
      period: new Date().getFullYear().toString(),
      periodType: "yearly",
      totalRevenue: "0",
      grossProfit: "0",
      netIncome: "0",
      operatingIncome: "0",
      costOfGoodsSold: "0",
      operatingExpenses: "0",
      totalAssets: "0",
      currentAssets: "0",
      inventory: "0",
      accountsReceivable: "0",
      totalLiabilities: "0",
      currentLiabilities: "0",
      accountsPayable: "0",
      totalEquity: "0",
      operatingCashFlow: "0",
      investingCashFlow: "0",
      financingCashFlow: "0",
      marketingSpend: "0",
      newCustomers: 0,
      totalCustomers: 0,
    },
  });

  // Set first company as default when companies load
  useState(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      const firstCompany = companies[0].id;
      setSelectedCompanyId(firstCompany);
      form.setValue("companyId", firstCompany);
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertFinancialData) => {
      const res = await apiRequest("POST", "/api/financial-data", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-data"] });
      toast({
        title: "Success",
        description: "Financial data saved to database successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save financial data",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertFinancialData) => {
    if (saveToDatabase) {
      createMutation.mutate(data);
    } else {
      // Preview mode - calculate metrics but don't save
      toast({
        title: "Preview Mode",
        description: "Data not saved. Enable 'Save to Database' to persist changes.",
      });
    }
  };

  // Calculate preview metrics from form values
  const calculatePreviewMetrics = () => {
    const values = form.watch();
    const revenue = parseFloat(values.totalRevenue || "0");
    const netIncome = parseFloat(values.netIncome || "0");
    const assets = parseFloat(values.totalAssets || "0");
    const equity = parseFloat(values.totalEquity || "0");
    const currentAssets = parseFloat(values.currentAssets || "0");
    const currentLiabilities = parseFloat(values.currentLiabilities || "0");

    return {
      netProfitMargin: revenue > 0 ? (netIncome / revenue) * 100 : 0,
      roa: assets > 0 ? (netIncome / assets) * 100 : 0,
      roe: equity > 0 ? (netIncome / equity) * 100 : 0,
      currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
    };
  };

  const previewMetrics = calculatePreviewMetrics();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="h-8 w-8" />
              Financial Data Worksheet
            </h1>
            <p className="text-muted-foreground mt-1">
              Input financial data and toggle database saving
            </p>
          </div>

          {/* Database Save Toggle */}
          <Card className="w-fit">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Switch
                  id="database-mode"
                  checked={saveToDatabase}
                  onCheckedChange={setSaveToDatabase}
                  data-testid="switch-database-save"
                />
                <Label htmlFor="database-mode" className="flex items-center gap-2 cursor-pointer">
                  <Database className="h-4 w-4" />
                  <span className="font-medium">
                    {saveToDatabase ? "Save to Database" : "Preview Mode"}
                  </span>
                </Label>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {saveToDatabase
                  ? "Data will be saved to the database"
                  : "Data will be calculated but not saved"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Preview Metrics */}
        {!saveToDatabase && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Live Preview Calculations
              </CardTitle>
              <CardDescription>Real-time metrics based on your inputs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Net Profit Margin</p>
                  <p className="text-2xl font-bold" data-testid="text-preview-npm">
                    {formatPercentage(previewMetrics.netProfitMargin)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">ROA</p>
                  <p className="text-2xl font-bold" data-testid="text-preview-roa">
                    {formatPercentage(previewMetrics.roa)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">ROE</p>
                  <p className="text-2xl font-bold" data-testid="text-preview-roe">
                    {formatPercentage(previewMetrics.roe)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Current Ratio</p>
                  <p className="text-2xl font-bold" data-testid="text-preview-current-ratio">
                    {previewMetrics.currentRatio.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Company and Period Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Company & Period</CardTitle>
                <CardDescription>Select company and reporting period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="companyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedCompanyId(value);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-company">
                              <SelectValue placeholder="Select company" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companies.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period</FormLabel>
                        <FormControl>
                          <Input placeholder="2024" {...field} data-testid="input-period" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="periodType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-period-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Income Statement */}
            <Card>
              <CardHeader>
                <CardTitle>Income Statement</CardTitle>
                <CardDescription>Revenue and expense data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="totalRevenue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Revenue</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-revenue" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="costOfGoodsSold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost of Goods Sold</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-cogs" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="grossProfit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gross Profit</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-gross-profit" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="operatingExpenses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operating Expenses</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-opex" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="operatingIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operating Income</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-operating-income" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="netIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Net Income</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-net-income" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Balance Sheet */}
            <Card>
              <CardHeader>
                <CardTitle>Balance Sheet</CardTitle>
                <CardDescription>Assets, liabilities, and equity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="totalAssets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Assets</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-total-assets" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currentAssets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Assets</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-current-assets" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="inventory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inventory</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-inventory" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountsReceivable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accounts Receivable</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-ar" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalLiabilities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Liabilities</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-total-liabilities" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currentLiabilities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Liabilities</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-current-liabilities" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountsPayable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accounts Payable</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-ap" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalEquity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Equity</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-total-equity" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cash Flow Statement */}
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Statement</CardTitle>
                <CardDescription>Operating, investing, and financing cash flows</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="operatingCashFlow"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operating Cash Flow</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-ocf" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="investingCashFlow"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Investing Cash Flow</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-icf" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="financingCashFlow"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Financing Cash Flow</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-fcf" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Business Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Business Metrics</CardTitle>
                <CardDescription>Marketing and customer data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="marketingSpend"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marketing Spend</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-marketing-spend" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="newCustomers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Customers</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-new-customers"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalCustomers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Customers</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-total-customers"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                data-testid="button-reset"
              >
                Reset Form
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-submit"
                className="min-w-32"
              >
                {createMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {saveToDatabase ? "Save to Database" : "Calculate Preview"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
