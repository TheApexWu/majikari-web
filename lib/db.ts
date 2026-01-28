/**
 * Prisma Client Singleton
 * 
 * In development, hot reloading can create multiple Prisma instances.
 * This pattern ensures we only have one client.
 */

import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
})

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
