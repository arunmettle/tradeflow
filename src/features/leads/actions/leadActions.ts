"use server";

import { redirect } from "next/navigation";
import { leadCreateInputSchema } from "@/core/leads/leadSchemas";
import { getTradieBySlugAsync } from "@/features/tradie/repo/tradieRepo";
import { createLeadAsync } from "../repo/leadRepo";

export async function createLeadActionAsync(slug: string, formData: FormData) {
  const tradie = await getTradieBySlugAsync(slug);
  if (!tradie) {
    throw new Error("Tradie not found");
  }

  const parsed = leadCreateInputSchema.parse({
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    customerPhone: formData.get("customerPhone"),
    siteAddress: formData.get("siteAddress"),
    suburb: formData.get("suburb"),
    jobCategory: formData.get("jobCategory"),
    jobDescription: formData.get("jobDescription"),
  });

  await createLeadAsync(tradie.id, parsed);
  redirect(`/t/${tradie.slug}/success`);
}
