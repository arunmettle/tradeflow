"use server";

import { redirect } from "next/navigation";
import {
  acceptQuoteByTokenAsync,
  declineQuoteByTokenAsync,
  getQuoteByTokenAsync,
} from "@/features/quotes/repo/quoteRepo";
import { createMessageAsync, lockConversationAsync } from "@/features/messages/repo/messageRepo";

export async function acceptQuoteActionAsync(token: string) {
  const link = await getQuoteByTokenAsync(token);
  if (!link || !link.quote) {
    redirect(`/q/${token}?status=invalid`);
  }
  await acceptQuoteByTokenAsync(token);
  await createMessageAsync(link.quote.id, "SYSTEM", "Customer accepted quote.");
  await lockConversationAsync(link.quote.id);
  redirect(`/q/${token}?status=accepted`);
}

export async function declineQuoteActionAsync(token: string, formData: FormData) {
  const reason = formData.get("declineReason")?.toString().trim();
  const link = await getQuoteByTokenAsync(token);
  if (!link || !link.quote) {
    redirect(`/q/${token}?status=invalid`);
  }
  await declineQuoteByTokenAsync(token, reason);
  const reasonText = reason ? ` Reason: ${reason}` : "";
  await createMessageAsync(link.quote.id, "SYSTEM", `Customer declined quote.${reasonText}`);
  redirect(`/q/${token}?status=declined`);
}
