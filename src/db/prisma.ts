import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const createClient = () =>
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const hasQuoteMessage = (client?: PrismaClient) =>
  Boolean((client as unknown as { quoteMessage?: unknown })?.quoteMessage);

export const prisma = hasQuoteMessage(globalForPrisma.prisma)
  ? (globalForPrisma.prisma as PrismaClient)
  : createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
