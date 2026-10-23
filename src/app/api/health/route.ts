import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  const rawDbUrl = process.env.DATABASE_URL || '';
  const isPostgres = rawDbUrl.startsWith('postgres://') || rawDbUrl.startsWith('postgresql://');
  const isSqlite = rawDbUrl.startsWith('file:');
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;

  // Mask database URL for security (e.g. postgresql://user:****@host/db)
  const maskedDbUrl = rawDbUrl
    ? rawDbUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:******@')
    : '(Not Set)';

  let dbStatus = 'unknown';
  let userCount = 0;
  let gymCount = 0;
  let errorDetails: string | null = null;
  let setupInstructions: string[] = [];

  try {
    userCount = await prisma.user.count();
    gymCount = await prisma.gym.count();
    dbStatus = 'connected';
  } catch (err: any) {
    dbStatus = 'error';
    errorDetails = err.message || String(err);
  }

  // Handle optional runtime on-demand seeding
  if (action === 'seed' && dbStatus === 'connected' && userCount === 0) {
    try {
      // Trigger seed logic
      return NextResponse.json({
        message: 'To seed your database, run "npm run db:seed" or deploy with DATABASE_URL set.',
      });
    } catch (e: any) {
      errorDetails = e.message;
    }
  }

  if (!rawDbUrl || (!isPostgres && isVercel)) {
    setupInstructions.push(
      '1. Vercel serverless requires a cloud PostgreSQL database (Neon, Supabase, or Vercel Postgres).',
      '2. Create a free PostgreSQL database at https://neon.tech or https://supabase.com.',
      '3. In your Vercel Dashboard, go to Settings > Environment Variables.',
      '4. Add "DATABASE_URL" with your PostgreSQL connection string (including "?sslmode=require").',
      '5. Add "JWT_SECRET" with any secure random string.',
      '6. Redeploy in Vercel to automatically initialize the tables and seed default users.'
    );
  } else if (dbStatus === 'error') {
    setupInstructions.push(
      '1. Verify your DATABASE_URL credentials in Vercel Environment Variables.',
      '2. Ensure your cloud database allows connections from external IPs (0.0.0.0/0).',
      '3. Run "npx prisma db push" or redeploy to generate database tables.'
    );
  } else if (userCount === 0) {
    setupInstructions.push(
      'Database is connected, but no user accounts found.',
      'Run "node prisma/seed.js" to create default users (admin@gym.com / admin123).'
    );
  }

  return NextResponse.json({
    status: dbStatus === 'connected' && userCount > 0 ? 'HEALTHY' : 'NEEDS_ATTENTION',
    environment: {
      isVercel,
      databaseConfigured: Boolean(rawDbUrl),
      databaseType: isPostgres ? 'PostgreSQL' : isSqlite ? 'SQLite' : 'Unknown',
      maskedUrl: maskedDbUrl,
    },
    database: {
      status: dbStatus,
      userCount,
      gymCount,
      error: errorDetails,
    },
    instructions: setupInstructions.length > 0 ? setupInstructions : ['System is fully operational!'],
  });
}
