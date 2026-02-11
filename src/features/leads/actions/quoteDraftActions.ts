"use server";

import { redirect } from "next/navigation";
import { getQuoteDraftService } from "@/services/ai/quoteDraftService";
import {
  createDraftQuoteFromLeadAsync,
  deleteDraftQuoteForLeadAsync,
} from "@/features/quotes/repo/quoteRepo";
import { getCurrentTradieAsync } from "@/features/tradie/repo/tradieRepo";
import { getLeadByIdAsync, updateLeadStatusAsync } from "../repo/leadRepo";
import { getRateHintsForDraftAsync } from "@/features/rates/repo/rateMemoryRepo";

export async function generateDraftQuoteActionAsync(leadId: string) {
  const tradie = await getCurrentTradieAsync();
  const lead = await getLeadByIdAsync(tradie.id, leadId);
  if (!lead) {
    throw new Error("Lead not found");
  }

  console.log("[quote-draft] Generating draft for lead", lead.id);
  const rateHints = await getRateHintsForDraftAsync(tradie.id, lead.jobCategory, 12);
  const service = await getQuoteDraftService();
  const draft = await service.draftQuoteAsync({
    tradieId: tradie.id,
    tradieName: tradie.businessName,
    lead: {
      jobCategory: lead.jobCategory,
      jobDescription: lead.jobDescription,
      siteAddress: lead.siteAddress,
      suburb: lead.suburb,
    },
    rateHints,
  });

  const quote = await createDraftQuoteFromLeadAsync(tradie.id, lead.id, draft);
  await updateLeadStatusAsync(tradie.id, lead.id, "QUOTED");
  redirect(`/quotes/${quote.id}/edit`);
}

export async function regenerateDraftQuoteActionAsync(leadId: string) {
  const tradie = await getCurrentTradieAsync();
  const lead = await getLeadByIdAsync(tradie.id, leadId);
  if (!lead) {
    throw new Error("Lead not found");
  }

  await deleteDraftQuoteForLeadAsync(tradie.id, lead.id);

  const rateHints = await getRateHintsForDraftAsync(tradie.id, lead.jobCategory, 12);
  const service = await getQuoteDraftService();
  const draft = await service.draftQuoteAsync({
    tradieId: tradie.id,
    tradieName: tradie.businessName,
    lead: {
      jobCategory: lead.jobCategory,
      jobDescription: lead.jobDescription,
      siteAddress: lead.siteAddress,
      suburb: lead.suburb,
    },
    rateHints,
  });

  const quote = await createDraftQuoteFromLeadAsync(tradie.id, lead.id, draft);
  await updateLeadStatusAsync(tradie.id, lead.id, "QUOTED");
  redirect(`/quotes/${quote.id}/edit`);
}
