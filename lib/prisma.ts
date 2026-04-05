import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from '@prisma/client'
import type { PoolConfig } from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set")
  }

  const config: PoolConfig = { connectionString }

  try {
    const databaseUrl = new URL(connectionString)
    const isRemotePostgres =
      (databaseUrl.protocol === "postgres:" || databaseUrl.protocol === "postgresql:") &&
      !["localhost", "127.0.0.1"].includes(databaseUrl.hostname)

    if (isRemotePostgres) {
      config.ssl = { rejectUnauthorized: false }
    }
  } catch {
    // Keep the raw connection string if URL parsing fails.
  }

  const adapter = new PrismaPg(config)

  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
