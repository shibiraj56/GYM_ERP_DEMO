import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'gym-erp-super-secret-key-tamil-nadu-2026';
export const AUTH_COOKIE_NAME = 'gym_auth_token';

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  role: 'OWNER_ADMIN' | 'RECEPTIONIST' | 'TRAINER';
  gymId: string;
  gymName: string;
}

export function signToken(payload: AuthSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthSession;
  } catch (error) {
    return null;
  }
}

/**
 * Get current authenticated user session in Next.js Server Components / Actions / Route Handlers
 */
export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Enforce authentication and return session, or throw an error
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized. Please log in.');
  }
  return session;
}

/**
 * Enforce Role-Based Access Control
 */
export async function requireRole(allowedRoles: ('OWNER_ADMIN' | 'RECEPTIONIST' | 'TRAINER')[]): Promise<AuthSession> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new Error(`Forbidden. Required role: ${allowedRoles.join(' or ')}`);
  }
  return session;
}

/**
 * Create Audit Log entry
 */
export async function createAuditLog(params: {
  gymId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        gymId: params.gymId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress,
      },
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
}
