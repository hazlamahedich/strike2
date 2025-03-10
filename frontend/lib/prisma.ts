import { PrismaClient } from '@prisma/client';

// Use a singleton pattern for PrismaClient to avoid multiple instances
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 