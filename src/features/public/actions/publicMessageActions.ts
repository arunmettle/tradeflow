"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { messageCreateSchema } from "@/core/messages/messageSchemas";
import { getQuoteByTokenAsync } from "@/features/quotes/repo/quoteRepo";
import { createMessageAsync } from "@/features/messages/repo/messageRepo";

const RATE_LIMIT_MS = 10_000;

export async function sendCustomerMessageActionAsync(token: string, formData: FormData) {
  const link = await getQuoteByTokenAsync(token);
  if (!link || !link.quote) {
    redirect(`/q/${token}?status=invalid`);
  }

  if (link.quote.isConversationLocked) {
    redirect(`/q/${token}?status=locked`);
  }

  const lastSent = link.quote.lastCustomerMessageAt;
  if (lastSent && Date.now() - new Date(lastSent).getTime() < RATE_LIMIT_MS) {
    redirect(`/q/${token}?status=rate_limited`);
  }

  const body = formData.get("body")?.toString() ?? "";
  const parsed = messageCreateSchema.parse({ body });
  await createMessageAsync(link.quote.id, "CUSTOMER", parsed.body);
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${link.quote.id}/edit`);
  revalidatePath(`/q/${token}`);
  redirect(`/q/${token}`);
}
