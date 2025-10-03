import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { insertFinancialDataSchema, type InsertFinancialData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FinancialDataFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  defaultPeriod?: string;
}

export default function FinancialDataForm({ open, onOpenChange, companyId, defaultPeriod }: FinancialDataFormProps) {
  const { toast } = useToast();

  const form = useForm<InsertFinancialData>({
    resolver: zodResolver(insertFinancialDataSchema),
    defaultValues: {
      companyId,
      period: defaultPeriod || new Date().getFullYear().toString(),
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
        description: "Financial data saved successfully",
      });
      onOpenChange(false);
      form.reset();
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
    createMutation.mutate(data);
  };

  // Update companyId and period when they change, without wiping other fields
  useEffect(() => {
    if (companyId && form.getValues("companyId") !== companyId) {
      form.setValue("companyId", companyId);
    }
  }, [companyId, form]);

  useEffect(() => {
    const currentPeriod = form.getValues("period");
    const newPeriod = defaultPeriod || new Date().getFullYear().toString();
    if (defaultPeriod && currentPeriod !== newPeriod) {
      form.setValue("period", newPeriod);
    }
  }, [defaultPeriod, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-form-title">Add Financial Data</DialogTitle>
          <DialogDescription>
            Enter financial data for a specific period. All monetary values should be in dollars.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-period-type">
                          <SelectValue placeholder="Select type" />
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

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Income Statement</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="totalRevenue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Revenue</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""} data-testid="input-revenue" />
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
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""} data-testid="input-cogs" />
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
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""} data-testid="input-gross-profit" />
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
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""} data-testid="input-operating-expenses" />
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
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""} data-testid="input-operating-income" />
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
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""} data-testid="input-net-income" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Balance Sheet</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="totalAssets"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Assets</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""} data-testid="input-total-assets" />
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
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""} data-testid="input-current-assets" />
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
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""} data-testid="input-inventory" />
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
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""} data-testid="input-accounts-receivable" />
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
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""} data-testid="input-total-liabilities" />
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
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""} data-testid="input-current-liabilities" />
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
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""} data-testid="input-accounts-payable" />
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
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""} data-testid="input-total-equity" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Cash Flow</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="operatingCashFlow"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operating Cash Flow</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""} data-testid="input-operating-cash-flow" />
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
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""} data-testid="input-investing-cash-flow" />
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
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""} data-testid="input-financing-cash-flow" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Business Metrics</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="marketingSpend"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marketing Spend</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""} data-testid="input-marketing-spend" />
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
                          placeholder="0" 
                          {...field}
                          value={field.value ?? ""}
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
                          placeholder="0" 
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-total-customers"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending ? "Saving..." : "Save Financial Data"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
