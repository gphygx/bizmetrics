/**
 * ============================================================================
 * MAIN SERVER FILE - BIZMETRICS FINANCIAL PLATFORM
 * ============================================================================
 * 
 * Enhanced Express server with complete authentication and security features.
 * Now includes session management, CORS, and secure middleware configuration.
 * 
 * NEW SECURITY FEATURES:
 * - Session-based authentication middleware
 * - CORS configuration for frontend integration
 * - Secure cookie handling for sessions
 * - Request logging with user context
 * - Enhanced error handling
 * 
 * SERVER ARCHITECTURE:
 * - Express.js with TypeScript
 * - PostgreSQL with Drizzle ORM
 * - Session-based authentication
 * - Vite integration for frontend
 * - Secure API routing
 */

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

/**
 * Extend Express Request type to include rawBody for webhook verification
 * and authentication data from our middleware
 */
declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// ============================================================================
// SECURITY & MIDDLEWARE CONFIGURATION
// ============================================================================

/**
 * CORS CONFIGURATION
 * 
 * Configure Cross-Origin Resource Sharing for frontend-backend communication.
 * Adjust origins based on your deployment environment.
 */
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173", // Vite default port
  credentials: true, // Allow cookies and authentication headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

/**
 * BODY PARSING MIDDLEWARE
 * 
 * Parse JSON and URL-encoded request bodies with security considerations.
 */
app.use(express.json({
  verify: (req, _res, buf) => {
    // Store raw body for potential webhook signature verification
    req.rawBody = buf;
  },
  limit: '10mb' // Prevent large payload attacks
}));

app.use(express.urlencoded({ 
  extended: false,
  limit: '10mb'
}));

/**
 * COOKIE PARSING MIDDLEWARE
 * 
 * Parse cookies for session management and authentication.
 * Required for session-based auth with cookies.
 */
app.use(cookieParser());

// ============================================================================
// REQUEST LOGGING MIDDLEWARE
// ============================================================================

/**
 * ENHANCED REQUEST LOGGING
 * 
 * Logs all API requests with user context, timing, and response details.
 * Now includes authenticated user information when available.
 */
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Capture JSON responses for logging
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;

    // Only log API routes to reduce noise
    if (path.startsWith("/api")) {
      const userInfo = (req as any).user ? `user:${(req as any).user.id}` : 'unauthenticated';
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms [${userInfo}]`;

      // Include response body for debugging (truncated for security)
      if (capturedJsonResponse) {
        const responsePreview = JSON.stringify(capturedJsonResponse);
        if (responsePreview.length > 80) {
          logLine += ` :: ${responsePreview.slice(0, 79)}…`;
        } else {
          logLine += ` :: ${responsePreview}`;
        }
      }

      log(logLine);
    }
  });

  next();
});

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

/**
 * HEALTH CHECK ROUTE
 * 
 * Public endpoint for load balancers and monitoring systems to check server status.
 * Returns basic server information without requiring authentication.
 */
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
});

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================

/**
 * SERVER BOOTSTRAP FUNCTION
 * 
 * Initializes all routes, middleware, and starts the HTTP server.
 * Handles both development and production environments.
 */
(async () => {
  try {
    // Register all API routes (including authentication)
    const server = await registerRoutes(app);

    // ========================================================================
    // GLOBAL ERROR HANDLING MIDDLEWARE
    // ========================================================================

    /**
     * CENTRAL ERROR HANDLER
     * 
     * Catches all unhandled errors from route handlers and middleware.
     * Returns consistent JSON error responses to clients.
     * 
     * SECURITY: In production, avoid leaking stack traces to clients.
     */
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Log detailed error for server monitoring
      console.error("Unhandled error:", {
        message: err.message,
        stack: err.stack,
        status: status,
        url: _req.url,
        method: _req.method
      });

      // Return sanitized error to client
      const errorResponse: any = { 
        message,
        status 
      };

      // Include validation errors if present
      if (err.errors) {
        errorResponse.errors = err.errors;
      }

      // Include stack trace in development for debugging
      if (app.get("env") === "development") {
        errorResponse.stack = err.stack;
      }

      res.status(status).json(errorResponse);

      // Re-throw for potential external error tracking (Sentry, etc.)
      if (app.get("env") === "development") {
        throw err;
      }
    });

    // ========================================================================
    // FRONTEND SERVING CONFIGURATION
    // ========================================================================

    /**
     * VITE DEVELOPMENT SERVER (Development Only)
     * 
     * In development, use Vite dev server with HMR for optimal developer experience.
     * This must be setup AFTER all API routes to avoid conflicts.
     */
    if (app.get("env") === "development") {
      await setupVite(app, server);
      log("Vite development server configured with HMR");
    } else {
      /**
       * STATIC FILE SERVING (Production Only)
       * 
       * In production, serve the built frontend files from the dist directory.
       * Ensure the frontend build includes all necessary assets.
       */
      serveStatic(app);
      log("Static file serving configured for production");
    }

    // ========================================================================
    // SERVER STARTUP
    // ========================================================================

    /**
     * SERVER PORT CONFIGURATION
     * 
     * Always serve on the port specified in the environment variable PORT.
     * This is required for Replit and other cloud platforms.
     * 
     * SECURITY: Binding to 0.0.0.0 allows external connections (required for cloud).
     */
    const port = parseInt(process.env.PORT || '5000', 10);

    server.listen({
      port,
      host: "0.0.0.0", // Required for external access
      reusePort: true, // Enable port reuse for load balancing
    }, () => {
      log(`🚀 BizMetrics Server running on port ${port}`);
      log(`📊 Environment: ${app.get("env")}`);
      log(`🔗 Health check: http://0.0.0.0:${port}/health`);
      log(`📈 API endpoints: http://0.0.0.0:${port}/api`);

      if (app.get("env") === "development") {
        log(`⚡ Vite dev server: http://localhost:5173`);
      }
    });

    // ========================================================================
    // GRACEFUL SHUTDOWN HANDLING
    // ========================================================================

    /**
     * GRACEFUL SHUTDOWN
     * 
     * Handle process signals to shutdown cleanly.
     * Important for cloud deployments and resource cleanup.
     */
    const gracefulShutdown = (signal: string) => {
      log(`Received ${signal}, shutting down gracefully...`);
      server.close(() => {
        log('HTTP server closed.');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        log('Forcing shutdown after timeout...');
        process.exit(1);
      }, 10000);
    };

    // Register signal handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    /**
     * SERVER BOOTSTRAP ERROR HANDLING
     * 
     * Catch and log any errors during server initialization.
     * This prevents silent failures during startup.
     */
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();

// ============================================================================
// DEPENDENCIES NEEDED
// ============================================================================

/**
 * REQUIRED PACKAGES:
 * 
 * Install these dependencies for the enhanced server:
 * 
 * npm install cors cookie-parser
 * npm install -D @types/cors @types/cookie-parser
 * 
 * AUTHENTICATION DEPENDENCIES:
 * npm install bcrypt
 * npm install -D @types/bcrypt
 */

/**
 * ENVIRONMENT VARIABLES:
 * 
 * Create a .env file with these variables:
 * 
 * PORT=5000
 * NODE_ENV=development
 * FRONTEND_URL=http://localhost:5173
 * DATABASE_URL=your_postgresql_connection_string
 * SESSION_SECRET=your_secure_session_secret
 */

/**
 * SECURITY CONSIDERATIONS:
 * 
 * 1. SESSION_SECRET: Use a long, random string in production
 * 2. DATABASE_URL: Use SSL-enabled connection strings
 * 3. CORS: Restrict origins in production to your actual domains
 * 4. RATE LIMITING: Consider adding rate limiting for auth endpoints
 * 5. HTTPS: Always use HTTPS in production with proper certificates
 */

/**
 * DEPLOYMENT NOTES:
 * 
 * 1. REplit: The PORT environment variable is automatically provided
 * 2. Production: Set NODE_ENV=production and configure proper CORS origins
 * 3. Monitoring: Consider adding application monitoring (Sentry, etc.)
 * 4. Logging: Implement structured logging for production use
 */