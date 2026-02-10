import prisma from "@/db/prisma";
import { messageCreateSchema } from "@/core/messages/messageSchemas";

type AuthorType = "CUSTOMER" | "TRADIE" | "SYSTEM";

export async function listMessagesAsync(quoteId: string) {
  return prisma.quoteMessage.findMany({
    where: { quoteId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createMessageAsync(
  quoteId: string,
  authorType: AuthorType,
  body: string
) {
  const parsed = messageCreateSchema.parse({ body });
  const now = new Date();
  const updateData: Record<string, Date | null> = {};

  if (authorType === "CUSTOMER") {
    updateData.lastCustomerMessageAt = now;
  } else if (authorType === "TRADIE") {
    updateData.lastTradieMessageAt = now;
  }

  return prisma.$transaction(async (tx) => {
    const message = await tx.quoteMessage.create({
      data: {
        quoteId,
        authorType,
        body: parsed.body,
      },
    });

    if (Object.keys(updateData).length > 0) {
      await tx.quote.update({
        where: { id: quoteId },
        data: updateData,
      });
    }

    return message;
  });
}

export async function lockConversationAsync(quoteId: string) {
  return prisma.quote.update({
    where: { id: quoteId },
    data: { isConversationLocked: true },
  });
}

export async function getUnreadCustomerMessageCountsForQuotesAsync(
  items: Array<{ quoteId: string; lastTradieMessageAt: Date | null }>
) {
  if (items.length === 0) {
    return new Map<string, number>();
  }

  const lastReadByQuoteId = new Map<string, number>();
  for (const item of items) {
    const time = item.lastTradieMessageAt ? new Date(item.lastTradieMessageAt).getTime() : 0;
    lastReadByQuoteId.set(item.quoteId, Number.isFinite(time) ? time : 0);
  }

  const messages = await prisma.quoteMessage.findMany({
    where: {
      quoteId: { in: items.map((item) => item.quoteId) },
      authorType: "CUSTOMER",
    },
    select: {
      quoteId: true,
      createdAt: true,
    },
  });

  const unreadCountByQuoteId = new Map<string, number>();
  for (const message of messages) {
    const lastRead = lastReadByQuoteId.get(message.quoteId) ?? 0;
    if (message.createdAt.getTime() <= lastRead) continue;
    unreadCountByQuoteId.set(
      message.quoteId,
      (unreadCountByQuoteId.get(message.quoteId) ?? 0) + 1
    );
  }

  return unreadCountByQuoteId;
}

export async function markConversationSeenByTradieAsync(quoteId: string, tradieId: string) {
  return prisma.quote.updateMany({
    where: { id: quoteId, tradieId },
    data: { lastTradieMessageAt: new Date() },
  });
}
