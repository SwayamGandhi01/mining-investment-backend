import jwt, { type SignOptions } from "jsonwebtoken";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

// ============================================================
// Node.js Runtime (for Route Handlers)
// ============================================================

/**
 * Sign a JWT token using jsonwebtoken (Node.js runtime only).
 * Use this in Route Handlers, NOT in middleware.
 */
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
}

/**
 * Verify a JWT token using jsonwebtoken (Node.js runtime only).
 * Use this in Route Handlers, NOT in middleware.
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload &
      TokenPayload;
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    throw new Error("Invalid or expired token");
  }
}

// ============================================================
// Edge Runtime (for Middleware)
// ============================================================

/**
 * Get the JWT secret encoded for jose (Edge Runtime).
 */
function getEdgeSecret(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET);
}

/**
 * Sign a JWT token using jose (Edge Runtime compatible).
 * Use this in middleware if needed.
 */
export async function signTokenEdge(payload: TokenPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(getEdgeSecret());
}

/**
 * Verify a JWT token using jose (Edge Runtime compatible).
 * Use this in middleware.
 */
export async function verifyTokenEdge(
  token: string
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getEdgeSecret());
    return {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}
