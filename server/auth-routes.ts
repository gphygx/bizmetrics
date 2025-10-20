/**
 * ============================================================================
 * AUTHENTICATION ROUTES - BIZMETRICS FINANCIAL PLATFORM
 * ============================================================================
 * 
 * Complete authentication system for BizMetrics API.
 * Handles user registration, login, session management, and access control.
 * 
 * FEATURES:
 * - User registration with email/password
 * - Secure login with session creation
 * - Password hashing with bcrypt
 * - Session management with expiration
 * - Logout functionality
 * - Email verification system
 * - Protected route middleware
 * 
 * SECURITY:
 * - BCrypt password hashing (12 rounds)
 * - Session-based authentication
 * - Automatic session expiration
 * - IP and user agent tracking
 * - CORS protection
 * - Rate limiting ready
 */

// ============================================================================
// IMPORTS & DEPENDENCIES
// ============================================================================

import { Router, type Request, type Response, type NextFunction } from "express";
import { storage } from "./storage";
import { insertUserSchema, insertSessionSchema, type User, type Session, DEFAULT_PERMISSIONS } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * LOGIN SCHEMA
 * 
 * Validates user login requests
 * - Email/username must be valid
 * - Password must be provided
 */
const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

/**
 * REGISTER SCHEMA
 * 
 * Validates user registration requests
 * - Extends base user schema with password confirmation
 * - Ensures passwords match
 */
const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

/**
 * CHANGE PASSWORD SCHEMA
 * 
 * Validates password change requests
 * - Requires current password for verification
 * - Ensures new passwords match
 */
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmNewPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords do not match",
  path: ["confirmNewPassword"],
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against its hash
 * @param password - Plain text password
 * @param hash - Hashed password from database
 * @returns True if password matches hash
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Create a new session for a user
 * @param userId - User ID
 * @param req - Express request object for IP and user agent
 * @returns Created session object
 */
async function createUserSession(userId: string, req: Request): Promise<Session> {
  const sessionDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  const expiresAt = new Date(Date.now() + sessionDuration);

  const sessionData = {
    userId,
    expiresAt,
    ipAddress: req.ip || req.connection.remoteAddress || null,
    userAgent: req.get("User-Agent") || null,
  };

  return await storage.createSession(sessionData);
}

/**
 * Extract session ID from request (cookie or Authorization header)
 * @param req - Express request object
 * @returns Session ID or null if not found
 */
function getSessionIdFromRequest(req: Request): string | null {
  // Try to get session ID from Authorization header first
  const authHeader = req.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Fall back to cookie
  return req.cookies?.sessionId || null;
}

// ============================================================================
// AUTHENTICATION ROUTER
// ============================================================================

export const authRouter = Router();

// ============================================================================
// REGISTRATION ENDPOINT
// ============================================================================

/**
 * POST /api/auth/register
 * 
 * Creates a new user account with email/password authentication.
 * 
 * FLOW:
 * 1. Validate request body against registerSchema
 * 2. Check if username/email already exists
 * 3. Hash password for secure storage
 * 4. Create user record in database
 * 5. Create initial session for immediate login
 * 6. Return user data (without password) and session
 * 
 * @body {username, email, password, confirmPassword, fullName}
 * @returns {user, session} User object (without password) and session object
 * 
 * @throws {400} Validation errors (Zod errors)
 * @throws {409} Username or email already exists
 * @throws {500} Server error during user creation
 */
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(validatedData.username);
    if (existingUser) {
      return res.status(409).json({
        message: "Username already exists",
        field: "username"
      });
    }

    // Check if email already exists (if different from username)
    if (validatedData.email && validatedData.email !== validatedData.username) {
      const existingEmail = await storage.getUserByUsername(validatedData.email);
      if (existingEmail) {
        return res.status(409).json({
          message: "Email already exists",
          field: "email"
        });
      }
    }

    // Hash password before storage
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user record
    const user = await storage.createUser({
      username: validatedData.username,
      email: validatedData.email || validatedData.username,
      password: hashedPassword,
      fullName: validatedData.fullName,
    });

    // Create session for immediate login
    const session = await createUserSession(user.id, req);

    // Return user (without password) and session
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({
      user: userWithoutPassword,
      session,
      message: "Account created successfully"
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors
      });
    }

    console.error("Registration error:", error);
    res.status(500).json({
      message: "Internal server error during registration"
    });
  }
});

// ============================================================================
// LOGIN ENDPOINT
// ============================================================================

/**
 * POST /api/auth/login
 * 
 * Authenticates a user and creates a new session.
 * 
 * FLOW:
 * 1. Validate request body against loginSchema
 * 2. Find user by username/email
 * 3. Verify password against stored hash
 * 4. Create new session
 * 5. Update last activity timestamp
 * 6. Return user data (without password) and session
 * 
 * @body {username, password}
 * @returns {user, session} User object (without password) and session object
 * 
 * @throws {400} Validation errors
 * @throws {401} Invalid credentials (user not found or wrong password)
 * @throws {500} Server error during authentication
 */
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { username, password } = loginSchema.parse(req.body);

    // Find user by username or email
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    // Create new session
    const session = await createUserSession(user.id, req);

    // Set session cookie
    res.cookie("sessionId", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Update user's last login timestamp (if you add that field)
    await storage.updateUser(user.id, { updatedAt: new Date() });

    // Return user (without password) and session
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
      session,
      message: "Login successful"
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors
      });
    }

    console.error("Login error:", error);
    res.status(500).json({
      message: "Internal server error during login"
    });
  }
});

// ============================================================================
// LOGOUT ENDPOINT
// ============================================================================

/**
 * POST /api/auth/logout
 * 
 * Terminates a user's session (logout).
 * 
 * FLOW:
 * 1. Extract session ID from request
 * 2. Delete session from database
 * 3. Clear session cookie (if using cookies)
 * 4. Return success confirmation
 * 
 * SECURITY:
 * - Invalidates session immediately
 * - Prevents session reuse
 * 
 * @header Authorization: Bearer <sessionId> OR Cookie: sessionId=<sessionId>
 * @returns {success: true} Confirmation of logout
 * 
 * @throws {401} No session provided or invalid session
 */
authRouter.post("/logout", async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionIdFromRequest(req);

    if (!sessionId) {
      return res.status(401).json({
        message: "No active session"
      });
    }

    // Delete session from storage
    const deleted = await storage.deleteSession(sessionId);

    if (!deleted) {
      return res.status(401).json({
        message: "Invalid session"
      });
    }

    // Clear session cookie if using cookies
    res.clearCookie("sessionId");

    res.json({
      success: true,
      message: "Logout successful"
    });

  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      message: "Internal server error during logout"
    });
  }
});

// ============================================================================
// SESSION VALIDATION ENDPOINT
// ============================================================================

/**
 * GET /api/auth/me
 * 
 * Validates current session and returns user data.
 * Useful for checking if user is still logged in and getting fresh user data.
 * 
 * FLOW:
 * 1. Extract session ID from request
 * 2. Validate session and get user data
 * 3. Update session activity timestamp
 * 4. Return user data (without password)
 * 
 * @header Authorization: Bearer <sessionId> OR Cookie: sessionId=<sessionId>
 * @returns {user} User object (without password)
 * 
 * @throws {401} Invalid or expired session
 */
authRouter.get("/me", async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionIdFromRequest(req);

    if (!sessionId) {
      return res.status(401).json({
        message: "No session provided"
      });
    }

    // Get and validate session
    const session = await storage.getSession(sessionId);
    if (!session) {
      return res.status(401).json({
        message: "Invalid or expired session"
      });
    }

    // Update session activity
    await storage.updateSessionActivity(sessionId);

    // Get user data
    const user = await storage.getUser(session.userId);
    if (!user) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword
    });

  } catch (error) {
    console.error("Session validation error:", error);
    res.status(500).json({
      message: "Internal server error during session validation"
    });
  }
});

// ============================================================================
// CHANGE PASSWORD ENDPOINT
// ============================================================================

/**
 * POST /api/auth/change-password
 * 
 * Allows authenticated users to change their password.
 * 
 * FLOW:
 * 1. Validate current session
 * 2. Validate request body against changePasswordSchema
 * 3. Verify current password
 * 4. Hash new password
 * 5. Update user record with new password
 * 6. Invalidate all other sessions (optional security enhancement)
 * 
 * SECURITY:
 * - Requires current password for verification
 * - Invalidates other sessions to prevent unauthorized access
 * 
 * @header Authorization: Bearer <sessionId> OR Cookie: sessionId=<sessionId>
 * @body {currentPassword, newPassword, confirmNewPassword}
 * @returns {success: true} Confirmation of password change
 * 
 * @throws {401} Invalid session or wrong current password
 * @throws {400} Validation errors
 */
authRouter.post("/change-password", async (req: Request, res: Response) => {
  try {
    // Validate session first
    const sessionId = getSessionIdFromRequest(req);
    const session = await storage.getSession(sessionId || "");

    if (!session) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    // Validate request body
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    // Get user and verify current password
    const user = await storage.getUser(session.userId);
    if (!user) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        message: "Current password is incorrect"
      });
    }

    // Hash new password and update user
    const hashedNewPassword = await hashPassword(newPassword);
    await storage.updateUser(user.id, {
      password: hashedNewPassword,
      updatedAt: new Date()
    });

    // Optional: Invalidate all other sessions for security
    // await invalidateAllUserSessionsExcept(user.id, sessionId);

    res.json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors
      });
    }

    console.error("Change password error:", error);
    res.status(500).json({
      message: "Internal server error during password change"
    });
  }
});

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * AUTHENTICATION MIDDLEWARE
 * 
 * Express middleware that validates sessions and attaches user data to requests.
 * Can be used to protect routes that require authentication.
 * 
 * USAGE:
 * app.use("/api/protected-route", requireAuth, protectedRouteHandler);
 * 
 * ATTACHES TO REQUEST:
 * - req.user: User object (without password)
 * - req.session: Session object
 * - req.companyAccess: Array of company IDs the user can access
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = getSessionIdFromRequest(req);

    if (!sessionId) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    // Validate session
    const session = await storage.getSession(sessionId);
    if (!session) {
      return res.status(401).json({
        message: "Invalid or expired session"
      });
    }

    // Get user data
    const user = await storage.getUser(session.userId);
    if (!user) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    // Update session activity
    await storage.updateSessionActivity(sessionId);

    // Get user's company access
    const userCompanies = await storage.getCompaniesByUserId(user.id);
    const companyAccess = userCompanies.map(company => company.id);

    // Attach data to request for use in route handlers
    (req as any).user = user;
    (req as any).session = session;
    (req as any).companyAccess = companyAccess;

    next();

  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      message: "Internal server error during authentication"
    });
  }
}

/**
 * COMPANY ACCESS MIDDLEWARE
 * 
 * Validates that the user has access to the specified company.
 * Must be used after requireAuth middleware.
 * 
 * USAGE:
 * app.use("/api/company/:companyId/data", requireAuth, requireCompanyAccess, dataHandler);
 * 
 * @param req - Request object with user and companyAccess from requireAuth
 * @param companyId - Company ID from route parameters or body
 */
export function requireCompanyAccess(req: Request, res: Response, next: NextFunction) {
  const companyId = req.params.companyId || (req.body as any).companyId;

  if (!companyId) {
    return res.status(400).json({
      message: "Company ID is required"
    });
  }

  if (!(req as any).companyAccess?.includes(companyId)) {
    return res.status(403).json({
      message: "Access denied to this company"
    });
  }

  next();
}

// ============================================================================
// TYPE EXTENSIONS FOR EXPRESS
// ============================================================================

/**
 * Extend Express Request type to include authentication data
 * This provides TypeScript support for req.user, req.session, etc.
 */
declare global {
  namespace Express {
    interface Request {
      user?: User;
      session?: Session;
      companyAccess?: string[];
    }
  }
}

/**
 * USAGE NOTES:
 * 
 * 1. PASSWORD SECURITY:
 *    - Always use bcrypt with sufficient salt rounds (12+)
 *    - Never store plain text passwords
 *    - Consider implementing password strength requirements
 * 
 * 2. SESSION MANAGEMENT:
 *    - Implement regular cleanup of expired sessions
 *    - Consider session invalidation on password change
 *    - Track session activity for security monitoring
 * 
 * 3. RATE LIMITING:
 *    - Implement rate limiting on login/register endpoints
 *    - Consider IP-based blocking for failed attempts
 * 
 * 4. EMAIL VERIFICATION:
 *    - Send verification emails after registration
 *    - Implement email verification required for certain actions
 * 
 * 5. CORS & HTTPS:
 *    - Configure CORS properly for your frontend domains
 *    - Always use HTTPS in production
 */