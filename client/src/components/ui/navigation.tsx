import { Link, useLocation } from "wouter";

export default function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", icon: "fas fa-tachometer-alt", label: "Dashboard" },
    { href: "/transactions", icon: "fas fa-receipt", label: "Transactions" },
    { href: "/invoices", icon: "fas fa-file-invoice-dollar", label: "Invoices" },
    { href: "/financial-metrics", icon: "fas fa-chart-bar", label: "Financial Metrics" },
    { href: "/reports", icon: "fas fa-file-alt", label: "Reports" },
    { href: "/contacts", icon: "fas fa-users", label: "Contacts" }
  ];

  const metricCategories = [
    { href: "profitability", icon: "fas fa-dollar-sign", label: "Profitability" },
    { href: "liquidity", icon: "fas fa-water", label: "Liquidity" },
    { href: "efficiency", icon: "fas fa-cogs", label: "Efficiency" },
    { href: "leverage", icon: "fas fa-balance-scale", label: "Leverage" },
    { href: "growth", icon: "fas fa-arrow-trend-up", label: "Growth" }
  ];

  const handleCategoryClick = (categoryId: string) => {
    // Navigate to financial metrics page if not already there
    if (location !== '/financial-metrics') {
      window.location.href = `/financial-metrics#${categoryId}`;
    } else {
      // Already on the page, update hash to trigger scroll
      window.location.hash = categoryId;
    }
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0 hidden lg:flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-chart-line text-primary-foreground text-lg"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">BizMetrics</h1>
            <p className="text-xs text-muted-foreground">Financial Analytics</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                location === item.href || (item.href === '/financial-metrics' && (location === '/' || location === '/financial-metrics'))
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <i className={`${item.icon} w-5`}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
        
        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Metric Categories
          </h3>
          <div className="space-y-1">
            {metricCategories.map((category) => (
              <button
                key={category.href}
                onClick={() => handleCategoryClick(category.href)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full text-left"
                data-testid={`category-${category.label.toLowerCase()}`}
              >
                <i className={`${category.icon} w-4 text-xs`}></i>
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-muted-foreground">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">john@company.com</p>
          </div>
          <button className="text-muted-foreground hover:text-foreground" data-testid="user-menu">
            <i className="fas fa-ellipsis-h"></i>
          </button>
        </div>
      </div>
    </aside>
  );
}
