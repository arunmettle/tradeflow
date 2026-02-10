import { quoteUpdateInputSchema, QuoteUpdateInput } from "./quoteSchemas";

const toBoolean = (val: FormDataEntryValue | null): boolean => {
  if (val === null || val === undefined) return false;
  const str = val.toString().toLowerCase();
  return str === "on" || str === "true" || str === "1";
};

const splitMultiline = (value: string | null | undefined) =>
  (value ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

export function mapQuoteUpdateFormDataToInput(formData: FormData): QuoteUpdateInput {
  const linesJson = formData.get("linesJson")?.toString() ?? "[]";
  let parsedLines: unknown = [];
  try {
    parsedLines = JSON.parse(linesJson);
  } catch {
    parsedLines = [];
  }

  const raw = {
    customerName: formData.get("customerName")?.toString().trim() ?? "",
    customerEmail: formData.get("customerEmail")?.toString().trim() || undefined,
    siteAddress: formData.get("siteAddress")?.toString().trim() || undefined,
    jobDescriptionRaw: formData.get("jobDescriptionRaw")?.toString().trim() ?? "",
    trade: formData.get("trade")?.toString().trim() || undefined,
    jobType: formData.get("jobType")?.toString().trim() || undefined,
    includeGst: toBoolean(formData.get("includeGst")),
    scopeBullets: splitMultiline(formData.get("scopeBulletsRaw")?.toString()),
    exclusions: splitMultiline(formData.get("exclusionsRaw")?.toString()),
    terms: {
      depositPercent: formData.get("depositPercent"),
      validityDays: formData.get("validityDays"),
      notes: formData.get("termsNotes")?.toString() ?? "",
    },
    lines: Array.isArray(parsedLines) ? parsedLines : [],
  };

  return quoteUpdateInputSchema.parse(raw);
}
