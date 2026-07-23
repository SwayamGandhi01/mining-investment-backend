import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { verifyToken, TokenPayload } from "./jwt";

const SALT_ROUNDS = 12;
const COOKIE_NAME = "admin_token";

/**
 * Hash a password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password.
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Set the authentication cookie.
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clear the authentication cookie.
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Get the current session from the authentication cookie.
 * Returns the decoded token payload or null if invalid/missing.
 */
export async function getSession(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Require authentication. Throws if not authenticated.
 * Use in Route Handlers to protect endpoints.
 */
export async function requireAuth(): Promise<TokenPayload> {
  const session = await getSession();

  if (!session) {
    throw new Error("Authentication required");
  }

  return session;
}

/**
 * Require a specific role. Throws if not authorized.
 */
export async function requireRole(
  allowedRoles: string[]
): Promise<TokenPayload> {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.role)) {
    throw new Error("Insufficient permissions");
  }

  return session;
}

export { COOKIE_NAME };
