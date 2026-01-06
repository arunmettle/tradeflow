"use server";

import { redirect } from "next/navigation";
import { getQuoteDraftService } from "@/services/ai/quoteDraftService";
import { createDraftQuoteFromLeadAsync } from "@/features/quotes/repo/quoteRepo";
import { getDefaultTradieAsync } from "@/features/tradie/repo/tradieRepo";
import { getLeadByIdAsync, updateLeadStatusAsync } from "../repo/leadRepo";

export async function generateDraftQuoteActionAsync(leadId: string) {
  const tradie = await getDefaultTradieAsync();
  const lead = await getLeadByIdAsync(tradie.id, leadId);
  if (!lead) {
    throw new Error("Lead not found");
  }

  console.log("[quote-draft] Generating draft for lead", lead.id);
  const service = await getQuoteDraftService();
  const draft = await service.draftQuoteAsync({
    tradieName: tradie.businessName,
    lead: {
      jobCategory: lead.jobCategory,
      jobDescription: lead.jobDescription,
      siteAddress: lead.siteAddress,
      suburb: lead.suburb,
    },
  });

  const quote = await createDraftQuoteFromLeadAsync(tradie.id, lead.id, draft);
  await updateLeadStatusAsync(tradie.id, lead.id, "QUOTED");
  redirect(`/quotes/${quote.id}/edit`);
}
