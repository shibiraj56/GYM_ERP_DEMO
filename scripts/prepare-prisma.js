const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment variables from .env if present
try {
  require('dotenv').config();
} catch (e) {
  // dotenv optional
}

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const dbUrl = process.env.DATABASE_URL || '';
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://') || isVercel;

if (isPostgres) {
  schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  console.log('✅ [prepare-prisma] Configured Prisma schema with PostgreSQL provider (Production/Vercel)');
} else {
  schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  console.log('ℹ️ [prepare-prisma] Configured Prisma schema with SQLite provider (Local Dev)');
}

fs.writeFileSync(schemaPath, schema);

// If running in an environment with PostgreSQL DATABASE_URL, push schema & seed if needed
if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
  try {
    console.log('🚀 [prepare-prisma] Automatically synchronizing PostgreSQL schema...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('🌱 [prepare-prisma] Ensuring database seed data is present...');
    execSync('node prisma/seed.js', { stdio: 'inherit' });
  } catch (err) {
    console.warn('⚠️ [prepare-prisma] Auto-push/seed notice:', err.message);
  }
}
