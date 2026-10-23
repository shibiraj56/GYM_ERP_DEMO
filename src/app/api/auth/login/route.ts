import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signToken, AUTH_COOKIE_NAME, createAuditLog } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const rawDbUrl = process.env.DATABASE_URL || '';
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;

    // Check if database URL is missing in Vercel
    if (isVercel && (!rawDbUrl || rawDbUrl.startsWith('file:'))) {
      return NextResponse.json(
        {
          error:
            'Cloud database not configured. Vercel serverless requires a PostgreSQL connection string. Please set "DATABASE_URL" in your Vercel Project Settings > Environment Variables. Visit /api/health for details.',
        },
        { status: 503 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: { gym: true },
      });
    } catch (dbErr: any) {
      console.error('Database query error in login:', dbErr);
      const msg = dbErr?.message || '';

      if (msg.includes('does not exist') || dbErr?.code === 'P2021') {
        return NextResponse.json(
          {
            error:
              'Database tables have not been created yet. Please run "npx prisma db push" or redeploy your Vercel project to initialize tables.',
          },
          { status: 500 }
        );
      }

      if (msg.includes("Can't reach database server") || dbErr?.code === 'P1001') {
        return NextResponse.json(
          {
            error:
              'Cannot reach PostgreSQL database server. Please verify your DATABASE_URL in Vercel Environment Variables.',
          },
          { status: 500 }
        );
      }

      if (msg.includes('protocol') || msg.includes('provider')) {
        return NextResponse.json(
          {
            error:
              'Prisma schema provider mismatch. Rebuilding your Vercel deployment will auto-align Prisma with PostgreSQL.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: `Database connection error: ${msg.split('\n')[0] || 'Unable to connect to database'}. Visit /api/health for diagnostic status.`,
        },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          error:
            'Invalid email or password. If this is a fresh database, please ensure seed data has been populated.',
        },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'This account has been deactivated' }, { status: 403 });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'OWNER_ADMIN' | 'RECEPTIONIST' | 'TRAINER',
      gymId: user.gymId,
      gymName: user.gym.name,
    };

    const token = signToken(sessionPayload);

    // Audit log
    await createAuditLog({
      gymId: user.gymId,
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      details: { email: user.email, role: user.role },
    });

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
    });

    // Set HTTP-only cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        error: error.message || 'An unexpected server error occurred. Check /api/health for details.',
      },
      { status: 500 }
    );
  }
}
