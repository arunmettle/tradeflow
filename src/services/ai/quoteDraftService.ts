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

type ExtractedJobFacts = {
  isFencing: boolean;
  lengthMeters: number | null;
  gateRequested: boolean;
  removeOldFence: boolean;
  mentionsTimber: boolean;
  mentionsColorbond: boolean;
};

function roundTo(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function extractLengthMetersFromText(text: string): number | null {
  const normalized = text.toLowerCase();
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:m|lm|metre|metres|meter|meters)\b/g,
    /\b(\d+(?:\.\d+)?)\s*(?:linear\s*)?(?:metre|metres|meter|meters)\b/g,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(normalized);
    if (!match) continue;
    const value = Number(match[1]);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
}

function extractJobFacts(lead: DraftContext["lead"]): ExtractedJobFacts {
  const source = `${lead.jobCategory ?? ""} ${lead.jobDescription ?? ""}`.toLowerCase();
  const isFencing =
    source.includes("fence") ||
    source.includes("fencing") ||
    source.includes("paling") ||
    source.includes("colorbond");

  const removeOldFence =
    source.includes("remove old") ||
    source.includes("replace") ||
    source.includes("existing fence") ||
    source.includes("demolition") ||
    source.includes("demo");

  const gateRequested = source.includes("gate");

  return {
    isFencing,
    lengthMeters: extractLengthMetersFromText(source),
    gateRequested,
    removeOldFence,
    mentionsTimber: source.includes("timber") || source.includes("paling"),
    mentionsColorbond: source.includes("colorbond") || source.includes("color bond"),
  };
}

function buildFencingLines(facts: ExtractedJobFacts) {
  const length = facts.lengthMeters ?? 1;
  const postSpacing = 2.4;
  const posts = Math.max(2, Math.ceil(length / postSpacing) + 1);
  const panels = Math.max(1, Math.ceil(length / postSpacing));

  const lines = [];
  if (facts.removeOldFence) {
    lines.push({
      name: "Remove and dispose existing fence",
      qty: roundTo(length, 2),
      unit: "m",
    });
  }

  lines.push({
    name: "Set out and install fence posts",
    qty: posts,
    unit: "post",
  });

  if (facts.mentionsColorbond) {
    lines.push({
      name: "Supply and install Colorbond fence panels",
      qty: panels,
      unit: "panel",
    });
  } else {
    lines.push({
      name: "Supply and install timber palings",
      qty: roundTo(length, 2),
      unit: "m",
    });
    lines.push({
      name: "Supply and install rails and fixings",
      qty: roundTo(length, 2),
      unit: "m",
    });
  }

  if (facts.gateRequested) {
    lines.push({
      name: "Supply and install gate hardware",
      qty: 1,
      unit: "each",
    });
  }

  lines.push({
    name: "Site setup and cleanup",
    qty: 1,
    unit: "job",
  });

  return lines;
}

function buildFencingScope(facts: ExtractedJobFacts, description: string) {
  const scope = [
    "Inspect and set out fence line before works commence.",
    facts.lengthMeters
      ? `Construct approximately ${facts.lengthMeters} metres of fencing to agreed alignment.`
      : "Construct fencing to agreed boundary alignment and specification.",
    facts.gateRequested
      ? "Include gate installation and alignment as part of the works."
      : "Include standard fence terminations and boundary tie-ins.",
    "Complete final cleanup and remove construction debris from site.",
  ];

  if (description && description.length > 0) {
    scope.splice(
      1,
      0,
      `Drafted from customer request: ${description.slice(0, 160)}${description.length > 160 ? "..." : ""}`
    );
  }

  return scope;
}

function buildFencingMissingQuestions(facts: ExtractedJobFacts, existing: string[]) {
  const questions = [...existing];
  if (!facts.lengthMeters) {
    questions.push("What is the total fence length in metres?");
  }
  if (!facts.removeOldFence) {
    questions.push("Is existing fence removal and disposal required?");
  }
  if (!facts.gateRequested) {
    questions.push("Do you need a gate included? If yes, what width and type?");
  }
  return Array.from(new Set(questions));
}

function normalizeGenericLineItems(lines: QuoteDraft["lineItems"]) {
  return lines
    .map((line) => ({
      name: line.name.trim(),
      qty: Number.isFinite(line.qty) ? Math.max(0, line.qty) : 0,
      unit: line.unit.trim() || "job",
    }))
    .filter((line) => line.name.length > 0);
}

function enrichDraftWithLeadFacts(input: DraftContext, rawDraft: QuoteDraft): QuoteDraft {
  const description = input.lead.jobDescription?.trim() ?? "";
  const facts = extractJobFacts(input.lead);
  const normalizedLineItems = normalizeGenericLineItems(rawDraft.lineItems ?? []);

  if (!facts.isFencing) {
    return quoteDraftSchema.parse({
      ...rawDraft,
      lineItems: normalizedLineItems,
    });
  }

  const hasMeasuredLine = normalizedLineItems.some(
    (line) =>
      (line.unit.toLowerCase() === "m" || line.unit.toLowerCase() === "lm") &&
      Number(line.qty) > 0
  );
  const hasRemovalLine = normalizedLineItems.some((line) =>
    /remove|demol|dispose|existing fence/.test(line.name.toLowerCase())
  );
  const hasFenceMaterialLine = normalizedLineItems.some((line) =>
    /paling|timber|colorbond|panel|post|rail/.test(line.name.toLowerCase())
  );

  const fallbackLines = buildFencingLines(facts);
  const lineItems =
    hasMeasuredLine && hasFenceMaterialLine
      ? normalizedLineItems
      : hasRemovalLine
      ? [...normalizedLineItems, ...fallbackLines.filter((line) => !/remove/i.test(line.name))]
      : fallbackLines;

  const scopeBullets =
    rawDraft.scopeBullets && rawDraft.scopeBullets.length >= 3
      ? rawDraft.scopeBullets
      : buildFencingScope(facts, description);
  const exclusions = rawDraft.exclusions?.length
    ? rawDraft.exclusions
    : [
        "Council permits, engineering, and approvals unless stated otherwise.",
        "Underground service relocations or latent site conditions.",
      ];

  const missingInfoQuestions = buildFencingMissingQuestions(
    facts,
    rawDraft.missingInfoQuestions ?? []
  );

  return quoteDraftSchema.parse({
    ...rawDraft,
    trade: rawDraft.trade || "Fencing",
    jobType: rawDraft.jobType || "Fence installation",
    scopeBullets,
    exclusions,
    lineItems: lineItems.slice(0, 8),
    missingInfoQuestions,
  });
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

    const facts = extractJobFacts(lead);
    const lineItems = facts.isFencing
      ? buildFencingLines(facts)
      : [
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

    const draft = quoteDraftSchema.parse({
      trade: cat || undefined,
      jobType: cat || undefined,
      scopeBullets: baseScope,
      exclusions: baseExclusions,
      lineItems,
      missingInfoQuestions,
    });
    return enrichDraftWithLeadFacts(input, draft);
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
          "You draft practical trade quote drafts from customer leads.",
          "Return STRICT JSON matching this schema:",
          '{"trade": string|optional, "jobType": string|optional, "scopeBullets": string[], "exclusions": string[], "lineItems": [{"name": string, "qty": number, "unit": string}], "missingInfoQuestions": string[]}',
          "Critical rules:",
          "- Do NOT include pricing or rates.",
          "- unitRate must never appear.",
          "- Keep 4-7 scope bullets.",
          "- Keep 2-4 exclusions specific to risk/assumptions.",
          "- Line items should be concrete and editable (labour + materials + disposal where relevant).",
          "- Infer quantities from text when available (e.g. '20 metres' => qty 20, unit m).",
          "- For fencing jobs, prefer line items like removal, posts, rails/palings or panels, gate, cleanup.",
          "- If details are missing, add targeted missingInfoQuestions.",
          "- Ask for missing info only if helpful.",
          "- Keep wording concise and professional.",
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
          const validated = quoteDraftSchema.parse(parsed);
          return enrichDraftWithLeadFacts(input, validated);
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
            return quoteDraftSchema.parse(draft);
          }
          return draft;
        }
      },
    };
  }
  console.log("[quote-draft] Using stub draft service");
  return stub;
}
