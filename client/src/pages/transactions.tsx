import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

export default function Transactions() {
  const transactions = [
    { id: 1, type: "income", description: "Payment from Client A", amount: 5000, date: "2024-10-01", status: "completed" },
    { id: 2, type: "expense", description: "Office Supplies", amount: 350, date: "2024-10-02", status: "completed" },
    { id: 3, type: "income", description: "Service Fee - Project B", amount: 8500, date: "2024-10-03", status: "completed" },
    { id: 4, type: "expense", description: "Software Subscription", amount: 299, date: "2024-10-03", status: "pending" },
    { id: 5, type: "income", description: "Consulting Services", amount: 12000, date: "2024-10-04", status: "completed" },
    { id: 6, type: "expense", description: "Marketing Campaign", amount: 2500, date: "2024-10-05", status: "completed" },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Transactions</h1>
        <p className="text-muted-foreground" data-testid="text-page-description">
          Track all your business income and expenses
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-total-income">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-income-value">$25,500</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-expenses">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-expenses-value">$3,149</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card data-testid="card-net-balance">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-balance-value">$22,351</div>
            <p className="text-xs text-muted-foreground">Income - Expenses</p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-transactions-list">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest business transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className="flex items-center justify-between p-4 border rounded-lg"
                data-testid={`transaction-${transaction.id}`}
              >
                <div className="flex items-center gap-4">
                  {transaction.type === "income" ? (
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <ArrowUpCircle className="h-5 w-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <ArrowDownCircle className="h-5 w-5 text-red-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium" data-testid={`transaction-description-${transaction.id}`}>
                      {transaction.description}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`transaction-date-${transaction.id}`}>
                      {transaction.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge 
                    variant={transaction.status === "completed" ? "default" : "secondary"}
                    data-testid={`transaction-status-${transaction.id}`}
                  >
                    {transaction.status}
                  </Badge>
                  <p 
                    className={`font-semibold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}
                    data-testid={`transaction-amount-${transaction.id}`}
                  >
                    {transaction.type === "income" ? "+" : "-"}${transaction.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
