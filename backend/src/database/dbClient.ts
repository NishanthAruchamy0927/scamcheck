import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL;

// Ensure pool is only initialized if Prisma client needs to be created
const initPrismaClient = () => {
  return new PrismaClient();
};

export const dbClient = global.prisma || initPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = dbClient;
}
