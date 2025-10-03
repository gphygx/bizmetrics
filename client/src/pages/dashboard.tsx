import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, DollarSign, TrendingUp, Users } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground" data-testid="text-page-description">
          Overview of your business performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-revenue-value">$2,847,500</div>
            <p className="text-xs text-muted-foreground" data-testid="text-revenue-change">
              +18.2% from last period
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-net-profit">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-profit-value">$520,950</div>
            <p className="text-xs text-muted-foreground" data-testid="text-profit-change">
              +12.5% from last period
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-customers">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-customers-value">2,450</div>
            <p className="text-xs text-muted-foreground" data-testid="text-customers-change">
              +145 this month
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-projects">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-projects-value">18</div>
            <p className="text-xs text-muted-foreground" data-testid="text-projects-change">
              +3 new this week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4" data-testid="card-overview">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Quick summary of key business metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your business is performing well with strong revenue growth and healthy profit margins.
                Customer acquisition is on track, and operational efficiency continues to improve.
              </p>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Revenue Growth</p>
                  <p className="text-2xl font-bold text-green-600">+18.2%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Profit Margin</p>
                  <p className="text-2xl font-bold">18.3%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3" data-testid="card-recent-activity">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest business updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3" data-testid="activity-item-1">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">New customer onboarded</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3" data-testid="activity-item-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Invoice paid</p>
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3" data-testid="activity-item-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Project milestone reached</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
