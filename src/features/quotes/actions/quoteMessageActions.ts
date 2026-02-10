"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { messageCreateSchema } from "@/core/messages/messageSchemas";
import { getCurrentTradieAsync } from "@/features/tradie/repo/tradieRepo";
import prisma from "@/db/prisma";
import { createMessageAsync } from "@/features/messages/repo/messageRepo";

export async function sendTradieMessageActionAsync(quoteId: string, formData: FormData) {
  const tradie = await getCurrentTradieAsync();
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, tradieId: tradie.id },
  });
  if (!quote) {
    throw new Error("Quote not found");
  }

  if (quote.isConversationLocked) {
    redirect(`/quotes/${quoteId}/edit?status=locked`);
  }

  const body = formData.get("body")?.toString() ?? "";
  const parsed = messageCreateSchema.parse({ body });
  await createMessageAsync(quote.id, "TRADIE", parsed.body);
  revalidatePath(`/quotes/${quoteId}/edit`);
  redirect(`/quotes/${quoteId}/edit?toast=message_sent`);
}
