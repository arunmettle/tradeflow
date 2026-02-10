import { quoteDraftSchema, QuoteDraft } from "@/core/ai/quoteDraftSchemas";

type DraftContext = {
  tradieName?: string | null;
  lead: {
    jobCategory?: string | null;
    jobDescription: string;
    siteAddress?: string | null;
    suburb?: string | null;
  };
};

export interface QuoteDraftService {
  draftQuoteAsync(input: DraftContext): Promise<QuoteDraft>;
}

class StubDraftService implements QuoteDraftService {
  async draftQuoteAsync(input: DraftContext): Promise<QuoteDraft> {
    const { lead } = input;
    const cat = (lead.jobCategory ?? "").trim();
    const description = lead.jobDescription?.trim() ?? "";

    const baseScope = [
      cat ? `Inspect site for ${cat.toLowerCase()} work` : "Initial site inspection",
      description ? `Plan work based on: ${description.slice(0, 140)}${description.length > 140 ? "..." : ""}` : "Confirm scope with customer",
      "Schedule works and manage site safety",
    ];

    const baseExclusions = [
      "Council or permit fees (if required)",
      "Unexpected remedial works outside agreed scope",
    ];

    const lineItems = [
      {
        name: cat ? `${cat} works` : "Labour and materials",
        qty: 1,
        unit: "job",
      },
      {
        name: "Site preparation and cleanup",
        qty: 1,
        unit: "job",
      },
    ];

    const missingInfoQuestions = [
      "Do you have any site photos we should review?",
      "Are there access constraints or time restrictions for the job?",
      "What timeline do you need this completed by?",
    ];

    return quoteDraftSchema.parse({
      trade: cat || undefined,
      jobType: cat || undefined,
      scopeBullets: baseScope,
      exclusions: baseExclusions,
      lineItems,
      missingInfoQuestions,
    });
  }
}

type UnknownRecord = Record<string, unknown>;
function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function getErrorStatus(err: unknown): number | undefined {
  if (!isRecord(err)) return undefined;
  const direct = err["status"];
  if (typeof direct === "number") return direct;
  const response = err["response"];
  if (isRecord(response) && typeof response["status"] === "number") return response["status"];
  return undefined;
}

function getErrorCode(err: unknown): string | undefined {
  if (!isRecord(err)) return undefined;
  const direct = err["code"];
  if (typeof direct === "string") return direct;
  const nested = err["error"];
  if (isRecord(nested) && typeof nested["code"] === "string") return nested["code"];
  return undefined;
}

async function tryCreateOpenAIService(): Promise<QuoteDraftService | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const { OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_QUOTE_MODEL?.trim() || "gpt-4.1-mini";

    return {
      async draftQuoteAsync(input: DraftContext): Promise<QuoteDraft> {
        const prompt = [
          "You draft scopes for trade quotes. Return STRICT JSON matching the schema:",
          '{"trade": string|optional, "jobType": string|optional, "scopeBullets": string[], "exclusions": string[], "lineItems": [{"name": string, "qty": number, "unit": string}], "missingInfoQuestions": string[]}',
          "Rules:",
          "- Do NOT include pricing or rates.",
          "- Keep 3-6 scope bullets.",
          "- Keep 2-4 exclusions.",
          "- Line items should be labour/material groupings, qty as numbers, unit like job/hour/unit.",
          "- Ask for missing info only if helpful.",
          `Tradie: ${input.tradieName ?? "Unknown"}`,
          `Category: ${input.lead.jobCategory ?? "Unspecified"}`,
          `Site: ${input.lead.siteAddress ?? ""} ${input.lead.suburb ?? ""}`,
          `Description: ${input.lead.jobDescription}`,
          "Only output JSON. No markdown.",
        ].join("\n");

        try {
          const completion = await client.responses.create({
            model,
            input: prompt,
            text: { format: { type: "json_object" } },
          });

          const raw = completion.output[0].content[0].text;
          const parsed = JSON.parse(raw);
          return quoteDraftSchema.parse(parsed);
        } catch (err) {
          console.error("[quote-draft] OpenAI request failed", err);
          throw err;
        }
      },
    };
  } catch (err) {
    console.warn("OpenAI draft service unavailable, falling back to stub:", err);
    return null;
  }
}

export async function getQuoteDraftService(): Promise<QuoteDraftService> {
  const stub = new StubDraftService();
  const openAIService = await tryCreateOpenAIService();
  if (openAIService) {
    console.log("[quote-draft] Using OpenAI draft service");
    // Resilient wrapper: if OpenAI is misconfigured (e.g. invalid API key) we
    // fall back to a deterministic stub so quote generation never hard-fails.
    return {
      async draftQuoteAsync(input: DraftContext): Promise<QuoteDraft> {
        try {
          return await openAIService.draftQuoteAsync(input);
        } catch (err) {
          const status = getErrorStatus(err);
          const code = getErrorCode(err);
          console.warn("[quote-draft] Falling back to stub draft service", {
            status,
            code,
          });

          const draft = await stub.draftQuoteAsync(input);
          if (status === 401 || code === "invalid_api_key") {
            return quoteDraftSchema.parse({
              ...draft,
              missingInfoQuestions: [
                ...(draft.missingInfoQuestions ?? []),
                "AI draft unavailable (invalid OPENAI_API_KEY). Using a basic draft.",
              ],
            });
          }
          return draft;
        }
      },
    };
  }
  console.log("[quote-draft] Using stub draft service");
  return stub;
}
