# VO Ledger - Financial Analytics Platform

## Overview

VO Ledger is a full-stack financial analytics application built to track and visualize company financial metrics. The application provides comprehensive dashboards for analyzing profitability, liquidity, efficiency, leverage, and growth metrics across different time periods. It's designed as a single-page application with a React frontend and Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: React with TypeScript, using Vite as the build tool and development server.

**UI Framework**: The application uses shadcn/ui components built on top of Radix UI primitives, styled with Tailwind CSS. This provides a consistent, accessible component library following the "new-york" style preset with a neutral color scheme.

**State Management**: TanStack Query (React Query) handles server state management, caching, and data fetching. The query client is configured with infinite stale time and disabled automatic refetching to optimize performance and reduce unnecessary network requests.

**Routing**: Wouter provides client-side routing, chosen for its lightweight footprint compared to React Router.

**Component Structure**: 
- Pages are organized in `client/src/pages/`, with the main application focused on the Financial Metrics view
- Reusable UI components live in `client/src/components/ui/`
- A sidebar navigation component provides access to different sections (Dashboard, Transactions, Invoices, Financial Metrics, Reports, Contacts)
- Financial calculations are centralized in `client/src/lib/financial-calculations.ts` for formatting currency, percentages, and deriving metric status

### Backend Architecture

**Framework**: Express.js server running on Node.js with TypeScript.

**API Design**: RESTful API endpoints provide data access:
- `GET /api/companies/:userId` - Retrieve companies for a user
- `GET /api/financial-data/:companyId` - Get financial data for a company, optionally filtered by period
- `GET /api/financial-data/:companyId/:period` - Get specific period's financial data
- `POST /api/financial-data` - Create or update financial data entries
- `GET /api/metrics/:companyId` - Get calculated metrics with optional period comparison
- `GET /api/metrics/:companyId/history` - Get historical metrics for charts
- `GET /api/alerts/:companyId` - Get metric alerts for a company
- `POST /api/alerts` - Create or update a metric alert
- `DELETE /api/alerts/:id` - Delete a metric alert

**Development Mode**: In development, Vite middleware is integrated into Express for hot module replacement and efficient asset serving. The server uses source maps for better debugging with the `@jridgewell/trace-mapping` package.

**Request Logging**: Custom middleware logs API requests with method, path, status code, response time, and truncated response bodies for debugging purposes.

**Storage Layer**: An abstraction layer (`IStorage` interface) separates business logic from data persistence. The application now uses `DbStorage` for PostgreSQL database persistence via Neon serverless, replacing the previous in-memory storage implementation.

### Data Storage

**ORM**: Drizzle ORM manages database schema and queries, configured for PostgreSQL dialect.

**Database Schema** (defined in `shared/schema.ts`):
- **users**: User accounts with username/password authentication
- **companies**: Companies owned by users, with one-to-many relationship
- **financial_data**: Comprehensive financial records per company and time period (unique constraint on company_id + period), including:
  - Income statement metrics (revenue, gross profit, net income, operating income, COGS, operating expenses)
  - Balance sheet data (assets, liabilities, equity, accounts receivable/payable, inventory)
  - Cash flow statements (operating, investing, financing cash flows)
  - Additional business metrics (marketing spend, customer acquisition)
  - Period tracking (monthly, quarterly, yearly)
- **metric_alerts**: User-configured threshold alerts for key metrics (unique constraint on company_id + metric_name):
  - Metric name, threshold value, condition (above/below), enabled status

**Database Provider**: Neon serverless PostgreSQL driver (`@neondatabase/serverless`) enables connection pooling and serverless-optimized database access.

**Schema Validation**: Drizzle-Zod integration generates Zod schemas from Drizzle table definitions, providing runtime type safety and validation for API inputs.

**Migrations**: Schema changes are managed through Drizzle Kit, with migrations stored in the `/migrations` directory.

### Build and Deployment

**Development**: `npm run dev` starts the development server with hot reloading via tsx and Vite integration.

**Production Build**: 
- Frontend: Vite bundles React application to `dist/public`
- Backend: esbuild bundles Express server to `dist/index.js` with ESM output
- `npm run build` executes both builds in sequence

**Type Checking**: TypeScript compilation is verified with `npm run check` without emitting files.

**Database Management**: `npm run db:push` synchronizes the Drizzle schema with the database without creating migration files.

### External Dependencies

**Database**: PostgreSQL via Neon serverless, configured through `DATABASE_URL` environment variable. The application will fail to start if this is not set.

**Session Management**: `connect-pg-simple` provides PostgreSQL-backed session storage for Express sessions (configured but not actively used in visible code).

**UI Component Libraries**: 
- Radix UI primitives for accessible, unstyled components
- Recharts for interactive charts and data visualization
- Embla Carousel for carousel functionality
- cmdk for command menu interface
- React Hook Form with Hookform Resolvers for form handling

**Utility Libraries**:
- `date-fns` for date manipulation and formatting
- `class-variance-authority` and `clsx` for conditional CSS class composition
- `nanoid` for generating unique IDs

### Recent Features (October 2025)

**Database Migration**: Successfully migrated from in-memory storage to PostgreSQL database with:
- Unique constraints on financial data (company_id, period) to prevent duplicates
- Unique constraints on metric alerts (company_id, metric_name)
- Upsert patterns using Drizzle's onConflictDoUpdate for data integrity

**Interactive Charts**: Added collapsible historical trends section featuring:
- 6 line charts visualizing key metrics over time (Revenue, Net Profit Margin, Operating Cash Flow, ROE, Current Ratio, Debt-to-Equity)
- Lazy loading - charts only fetch data when expanded
- Built with Recharts and shadcn chart components
- Historical data API endpoint serving time-series metrics

**Alert System Backend**: Implemented foundation for customizable metric alerts:
- Database schema for storing alert configurations per company and metric
- CRUD API endpoints for managing alerts
- Frontend UI integration pending (scheduled as next development phase)

**Development Tools** (Replit-specific):
- `@replit/vite-plugin-runtime-error-modal` for error overlays
- `@replit/vite-plugin-cartographer` for code navigation
- `@replit/vite-plugin-dev-banner` for development indicators