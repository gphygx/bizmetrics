# How to Add Your Financial Data to BizMetrics

Now that the demo data has been removed, here's how to add your own company's real financial numbers using the built-in form.

---

## 🔐 First Time Login

After deploying BizMetrics, you'll need to log in with the demo account:

**Demo Credentials:**
- **Username:** `demo`
- **Password:** `demo123`

**Login Steps:**
1. Open BizMetrics in your browser (e.g., `http://your-server-ip:3000`)
2. You'll see the login page
3. Enter username: `demo`
4. Enter password: `demo123`
5. Click "Login"

You're now logged in and can access the Financial Metrics dashboard!

---

## 🎯 Quick Start

1. **Log in** to BizMetrics (see above)
2. **Navigate to Financial Metrics** page (should load automatically)
3. **Click "Add Data"** button (top right of the dashboard)
4. **Fill in your financial numbers**
5. **Click "Save"**

That's it! Your metrics will automatically calculate and display.

---

## 📝 Step-by-Step Guide

### Step 1: Access the Form

On the Financial Metrics dashboard, look for the **"Add Data"** button in the top-right corner (next to the period selector).

Click it to open the Financial Data Form.

---

### Step 2: Choose Your Period

The form opens with three main settings at the top:

**Period:**
- Enter the time period for this data (e.g., "2024", "2024-Q1", "2024-01")

**Period Type:**
- Choose from dropdown:
  - **Yearly** - For annual data (e.g., "2024")
  - **Quarterly** - For quarter data (e.g., "2024-Q1")
  - **Monthly** - For monthly data (e.g., "2024-01")

---

### Step 3: Fill in Your Numbers

The form is organized into 4 sections. You don't have to fill in every field - just the ones you have data for!

#### 📊 Income Statement Section

**Revenue & Profitability:**
- **Total Revenue** - Your total sales for the period
- **Gross Profit** - Revenue minus Cost of Goods Sold
- **Net Income** - Your bottom-line profit (or loss)
- **Operating Income** - Profit from core business operations

**Costs:**
- **Cost of Goods Sold (COGS)** - Direct costs to produce your products/services
- **Operating Expenses** - SG&A, R&D, marketing, and other operational costs

**Example:**
```
Total Revenue:        $500,000
Gross Profit:         $200,000
Net Income:           $85,000
Operating Income:     $95,000
COGS:                 $300,000
Operating Expenses:   $105,000
```

---

#### 💰 Balance Sheet Section

**Assets:**
- **Total Assets** - Everything your company owns
- **Current Assets** - Assets convertible to cash within 1 year
- **Inventory** - Unsold goods/products on hand
- **Accounts Receivable** - Money customers owe you

**Liabilities & Equity:**
- **Total Liabilities** - Everything your company owes
- **Current Liabilities** - Debts due within 1 year
- **Accounts Payable** - Money you owe to suppliers
- **Total Equity** - Shareholders' equity / owner's equity

**Example:**
```
Total Assets:         $1,000,000
Current Assets:       $400,000
Inventory:            $80,000
Accounts Receivable:  $120,000

Total Liabilities:    $600,000
Current Liabilities:  $200,000
Accounts Payable:     $75,000
Total Equity:         $400,000
```

---

#### 💵 Cash Flow Section

Track how cash moves through your business:

- **Operating Cash Flow** - Cash generated from normal operations
- **Investing Cash Flow** - Cash used for investments (usually negative)
- **Financing Cash Flow** - Cash from loans, investors, or dividends (can be positive or negative)

**Example:**
```
Operating Cash Flow:  $95,000
Investing Cash Flow:  -$25,000 (you spent on equipment)
Financing Cash Flow:  -$10,000 (you paid down debt)
```

**Note:** Use negative numbers (with minus sign) for cash outflows.

---

#### 🎯 Business Metrics Section

Customer and marketing data:

- **Marketing Spend** - Total marketing and advertising costs
- **New Customers** - Number of new customers acquired this period
- **Total Customers** - Total active customer count at end of period

**Example:**
```
Marketing Spend:      $35,000
New Customers:        125
Total Customers:      1,450
```

---

### Step 4: Save Your Data

**Click "Save"** at the bottom of the form.

You'll see:
- ✅ Success message: "Financial data saved successfully"
- 📊 Dashboard automatically updates with your new metrics
- 🎨 Color-coded health indicators appear on each metric tile

---

## 💡 Pro Tips

### Don't Have All the Numbers?

**That's okay!** You can:
- Fill in what you have and leave the rest at $0
- Add more data later by clicking "Add Data" again with the same period
- The system will update your existing data for that period

### Entering Multiple Periods

To track trends over time:
1. Add data for 2023 (yearly)
2. Add data for 2024 (yearly)
3. Add data for 2024-Q1, Q2, Q3, Q4 (quarterly)

**The dashboard will automatically:**
- Calculate period-over-period changes
- Show trend arrows (↑ improving, ↓ declining)
- Display historical charts when you expand the "Historical Trends" section

### Understanding the Calculations

BizMetrics automatically calculates 27+ financial metrics from your raw data:

**Profitability Metrics:**
- Net Profit Margin = (Net Income / Revenue) × 100%
- Gross Profit Margin = (Gross Profit / Revenue) × 100%
- Operating Margin = (Operating Income / Revenue) × 100%
- ROE = (Net Income / Equity) × 100%
- ROA = (Net Income / Assets) × 100%

**Liquidity Metrics:**
- Current Ratio = Current Assets / Current Liabilities
- Quick Ratio = (Current Assets - Inventory) / Current Liabilities
- Working Capital = Current Assets - Current Liabilities

**Efficiency Metrics:**
- Inventory Turnover = COGS / Average Inventory
- AR Turnover = Revenue / Average AR
- Asset Turnover = Revenue / Total Assets

**Growth Metrics:**
- Revenue Growth = % change from previous period
- Customer Growth = % change in customers
- Profit Growth = % change in net income

And many more! Hover over the info icon (ℹ️) next to any metric to see its definition.

---

## 🔍 Example: Adding Your First Data Entry

Let's say you run a small ecommerce business and want to add your 2024 annual data:

**1. Click "Add Data"**

**2. Set Period Info:**
- Period: `2024`
- Period Type: `Yearly`

**3. Fill in Income Statement:**
- Total Revenue: `1250000`
- Gross Profit: `550000`
- Net Income: `125000`
- Operating Income: `145000`
- COGS: `700000`
- Operating Expenses: `405000`

**4. Fill in Balance Sheet:**
- Total Assets: `850000`
- Current Assets: `320000`
- Inventory: `85000`
- Accounts Receivable: `95000`
- Total Liabilities: `480000`
- Current Liabilities: `180000`
- Accounts Payable: `55000`
- Total Equity: `370000`

**5. Fill in Cash Flow:**
- Operating Cash Flow: `145000`
- Investing Cash Flow: `-35000`
- Financing Cash Flow: `-15000`

**6. Fill in Business Metrics:**
- Marketing Spend: `85000`
- New Customers: `420`
- Total Customers: `1850`

**7. Click "Save"**

**Result:** BizMetrics calculates:
- ✅ Net Profit Margin: 10%
- ✅ Current Ratio: 1.78
- ✅ ROE: 33.78%
- ✅ Customer Acquisition Cost: $202
- And 23+ more metrics!

---

## 🎨 What Happens After Saving?

**Immediate Updates:**
1. **Metric Cards** display calculated values
2. **Health Indicators** show status (Great, Good, Poor, Critical)
3. **Trend Arrows** compare to previous periods (if available)
4. **Historical Charts** update with new data point

**Color Coding:**
- 🟢 Green badge = Great performance
- 🔵 Blue badge = Good performance
- 🟡 Yellow badge = Needs improvement
- 🔴 Red badge = Critical - needs attention

---

## 📊 Viewing Your Metrics

After adding data:

**Top Metrics Dashboard:**
- Total Revenue
- Net Profit Margin
- Operating Cash Flow
- Return on Equity

**Profitability Section:**
- Gross Profit Margin
- Operating Margin
- ROA
- Customer Acquisition Cost
- EBITDA Margin

**Liquidity Section:**
- Current Ratio
- Quick Ratio
- Working Capital
- Days Sales Outstanding
- Cash Conversion Cycle

**Efficiency Section:**
- Inventory Turnover
- AR Turnover
- AP Turnover
- Asset Turnover
- Customer Lifetime Value

**Leverage Section:**
- Debt to Equity Ratio
- Debt Ratio
- Free Cash Flow
- Operating Cash Flow Ratio

**Growth Section:**
- Revenue Growth
- Customer Growth
- Profit Growth

---

## 🔄 Updating Existing Data

To update numbers for a period you already entered:

1. Click "Add Data"
2. Enter the **same period** (e.g., "2024")
3. Fill in the new numbers
4. Click "Save"

**The system automatically updates** the existing record - no duplicates!

---

## 🗑️ Clearing Old Demo Data (If Needed)

**Good news:** New deployments using the latest seed file automatically start with a clean database (no demo financial data).

**If you deployed earlier and still see old demo data:**

**Option 1: Fresh Deployment (Recommended)**
```bash
# On your server
cd ~/bizmetrics
docker compose down
docker compose build --no-cache
docker compose run --rm bizmetrics npm run db:push --force
docker compose up -d
```

This rebuilds everything with the latest clean seed.

**Option 2: Manual Database Clear**
```bash
# Connect to your server
ssh root@your-server-ip
cd ~/bizmetrics

# Clear financial data only (keeps user/company)
docker compose exec bizmetrics sh
psql $DATABASE_URL -c "DELETE FROM financial_data;"
exit
```

**Now add your own data using the form!**

---

## ❓ Troubleshooting

**Form won't save:**
- Check that you filled in at least the required fields (Period, Period Type)
- Make sure monetary values are numbers (no $, commas)
- Check browser console for errors (F12 → Console tab)

**Metrics showing $0 or N/A:**
- This means you haven't added data for that period yet
- Click "Add Data" and fill in your numbers

**Can't see the "Add Data" button:**
- Make sure you're logged in (use demo/demo123)
- Navigate to the "Financial Metrics" page
- The button is in the top-right corner next to the period selector

**Login issues:**
- Username is `demo` (not demo@company.com)
- Password is `demo123` (case sensitive)
- Clear browser cookies and try again
- Check server logs: `docker compose logs bizmetrics`

**Getting validation errors:**
- All monetary fields accept decimal numbers (e.g., `1250000.50`)
- New Customers and Total Customers must be whole numbers (e.g., `125`)
- Period should match the Period Type format:
  - Yearly: `2024`
  - Quarterly: `2024-Q1`
  - Monthly: `2024-01`

---

## 🚀 Next Steps

Now that you know how to add data:

1. **Add your current year data** (2024 or 2025)
2. **Add previous year for comparison** (2023)
3. **Add quarterly data** for detailed trends
4. **Explore the Historical Trends** section (expand the collapsible)
5. **Set up metric alerts** (coming soon!)
6. **Export reports** (coming soon!)

---

## 💪 You're All Set!

Your BizMetrics dashboard is now ready to track your real financial performance. The more data you add, the more powerful the insights become!

**Key Takeaway:** You don't need to be a financial expert. Just enter the numbers you have, and BizMetrics does the complex calculations for you automatically! 📈
