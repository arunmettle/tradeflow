"use server";

import { revalidatePath } from "next/cache";
import { upsertDefaultTradieAsync } from "../repo/tradieRepo";

export async function upsertDefaultTradieActionAsync(formData: FormData) {
  const planInput = formData.get("plan")?.toString().trim().toUpperCase();
  const safePlan = planInput === "PAID" ? "PAID" : "FREE";

  await upsertDefaultTradieAsync({
    slug: formData.get("slug")?.toString().trim() ?? "",
    businessName: formData.get("businessName")?.toString().trim() ?? "",
    plan: safePlan,
  });

  revalidatePath("/tradie");
}
