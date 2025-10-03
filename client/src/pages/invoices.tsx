import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

export default function Invoices() {
  const invoices = [
    { id: "INV-001", client: "Acme Corporation", amount: 5000, date: "2024-10-01", dueDate: "2024-10-31", status: "paid" },
    { id: "INV-002", client: "TechStart Inc", amount: 8500, date: "2024-09-15", dueDate: "2024-10-15", status: "overdue" },
    { id: "INV-003", client: "Global Solutions", amount: 12000, date: "2024-10-05", dueDate: "2024-11-05", status: "pending" },
    { id: "INV-004", client: "Innovation Labs", amount: 6500, date: "2024-09-28", dueDate: "2024-10-28", status: "paid" },
    { id: "INV-005", client: "Digital Ventures", amount: 9200, date: "2024-10-10", dueDate: "2024-11-10", status: "pending" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "pending":
        return "secondary";
      case "overdue":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Invoices</h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Manage your client invoices and payments
          </p>
        </div>
        <Button data-testid="button-create-invoice">
          <FileText className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="card-total-invoiced">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-invoiced">$41,200</div>
            <p className="text-xs text-muted-foreground">5 invoices</p>
          </CardContent>
        </Card>

        <Card data-testid="card-paid-invoices">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-paid-amount">$11,500</div>
            <p className="text-xs text-muted-foreground">2 invoices</p>
          </CardContent>
        </Card>

        <Card data-testid="card-pending-invoices">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-amount">$21,200</div>
            <p className="text-xs text-muted-foreground">2 invoices</p>
          </CardContent>
        </Card>

        <Card data-testid="card-overdue-invoices">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-overdue-amount">$8,500</div>
            <p className="text-xs text-muted-foreground">1 invoice</p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-invoices-list">
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>Overview of all client invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div 
                key={invoice.id} 
                className="flex items-center justify-between p-4 border rounded-lg"
                data-testid={`invoice-${invoice.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium" data-testid={`invoice-client-${invoice.id}`}>
                      {invoice.client}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span data-testid={`invoice-id-${invoice.id}`}>{invoice.id}</span>
                      <span>•</span>
                      <span data-testid={`invoice-date-${invoice.id}`}>Issued: {invoice.date}</span>
                      <span>•</span>
                      <span data-testid={`invoice-due-${invoice.id}`}>Due: {invoice.dueDate}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge 
                    variant={getStatusColor(invoice.status)}
                    data-testid={`invoice-status-${invoice.id}`}
                  >
                    {invoice.status}
                  </Badge>
                  <p className="font-semibold w-28 text-right" data-testid={`invoice-amount-${invoice.id}`}>
                    ${invoice.amount.toLocaleString()}
                  </p>
                  <Button variant="ghost" size="icon" data-testid={`button-download-${invoice.id}`}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
