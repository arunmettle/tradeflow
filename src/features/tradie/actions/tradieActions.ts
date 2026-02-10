"use server";

import { revalidatePath } from "next/cache";
import { upsertDefaultTradieAsync } from "../repo/tradieRepo";

const splitCommaList = (value: FormDataEntryValue | null) =>
  (value?.toString() ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const parseTestimonials = (value: FormDataEntryValue | null) =>
  (value?.toString() ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [name = "", suburb = "", ...textParts] = line.split("|").map((part) => part.trim());
      return {
        name,
        suburb: suburb || undefined,
        text: textParts.join(" | "),
      };
    });

const parseProjects = (value: FormDataEntryValue | null) =>
  (value?.toString() ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [title = "", suburb = "", ...summaryParts] = line.split("|").map((part) => part.trim());
      return {
        title,
        suburb: suburb || undefined,
        summary: summaryParts.join(" | "),
      };
    });

export async function upsertDefaultTradieActionAsync(formData: FormData) {
  const planInput = formData.get("plan")?.toString().trim().toUpperCase();
  const safePlan = planInput === "PAID" ? "PAID" : "FREE";

  await upsertDefaultTradieAsync({
    slug: formData.get("slug")?.toString().trim() ?? "",
    businessName: formData.get("businessName")?.toString().trim() ?? "",
    tagline: formData.get("tagline")?.toString().trim(),
    about: formData.get("about")?.toString().trim(),
    email: formData.get("email")?.toString().trim(),
    phone: formData.get("phone")?.toString().trim(),
    logoUrl: formData.get("logoUrl")?.toString().trim(),
    website: formData.get("website")?.toString().trim(),
    addressLine1: formData.get("addressLine1")?.toString().trim(),
    addressLine2: formData.get("addressLine2")?.toString().trim(),
    suburb: formData.get("suburb")?.toString().trim(),
    state: formData.get("state")?.toString().trim(),
    postcode: formData.get("postcode")?.toString().trim(),
    services: splitCommaList(formData.get("services")),
    serviceAreas: splitCommaList(formData.get("serviceAreas")),
    testimonials: parseTestimonials(formData.get("testimonials")),
    projects: parseProjects(formData.get("projects")),
    brandSettings: {
      primaryColor: formData.get("brandPrimaryColor")?.toString().trim() || undefined,
      footerText: formData.get("brandFooterText")?.toString().trim() || undefined,
    },
    plan: safePlan,
  });

  revalidatePath("/tradie");
  revalidatePath("/profile");
}
