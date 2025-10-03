import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileBarChart, Download, Calendar } from "lucide-react";

export default function Reports() {
  const reports = [
    { 
      id: 1, 
      name: "Monthly Financial Summary", 
      description: "Comprehensive financial overview for the month",
      type: "Financial",
      date: "2024-10-01",
      size: "2.4 MB"
    },
    { 
      id: 2, 
      name: "Quarterly Performance Report", 
      description: "Q3 2024 business performance analysis",
      type: "Performance",
      date: "2024-09-30",
      size: "3.1 MB"
    },
    { 
      id: 3, 
      name: "Annual Tax Summary", 
      description: "Tax year 2024 comprehensive summary",
      type: "Tax",
      date: "2024-08-15",
      size: "1.8 MB"
    },
    { 
      id: 4, 
      name: "Cash Flow Analysis", 
      description: "Detailed cash flow breakdown and projections",
      type: "Financial",
      date: "2024-10-05",
      size: "2.2 MB"
    },
    { 
      id: 5, 
      name: "Customer Analytics", 
      description: "Customer acquisition and retention metrics",
      type: "Analytics",
      date: "2024-09-28",
      size: "1.5 MB"
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Reports</h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Access and generate business reports
          </p>
        </div>
        <Button data-testid="button-generate-report">
          <FileBarChart className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-financial-reports">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Financial Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-financial-count">12</div>
            <p className="text-xs text-muted-foreground">Available reports</p>
          </CardContent>
        </Card>

        <Card data-testid="card-performance-reports">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Performance Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-performance-count">8</div>
            <p className="text-xs text-muted-foreground">Available reports</p>
          </CardContent>
        </Card>

        <Card data-testid="card-custom-reports">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Custom Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-custom-count">5</div>
            <p className="text-xs text-muted-foreground">Available reports</p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-reports-list">
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Your recently generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div 
                key={report.id} 
                className="flex items-center justify-between p-4 border rounded-lg"
                data-testid={`report-${report.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileBarChart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium" data-testid={`report-name-${report.id}`}>
                      {report.name}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`report-description-${report.id}`}>
                      {report.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded" data-testid={`report-type-${report.id}`}>
                        {report.type}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span data-testid={`report-date-${report.id}`}>{report.date}</span>
                      </div>
                      <span className="text-xs text-muted-foreground" data-testid={`report-size-${report.id}`}>
                        {report.size}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" data-testid={`button-view-${report.id}`}>
                    View
                  </Button>
                  <Button variant="outline" size="icon" data-testid={`button-download-${report.id}`}>
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
