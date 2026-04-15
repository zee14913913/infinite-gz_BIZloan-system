import 'dotenv/config'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaPg } from '@prisma/adapter-pg'

// Import from generated path (Prisma 7 — not from '@prisma/client')
import { PrismaClient } from '@/generated/prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createAdapter() {
  const url = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'
  // Derive adapter from URL scheme — not NODE_ENV.
  // SQLite: file:./... | PostgreSQL: postgresql://... or postgres://...
  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    return new PrismaPg({ connectionString: url })
  }
  return new PrismaBetterSqlite3({ url })
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: createAdapter(),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
