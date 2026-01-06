const STOP_WORDS = new Set(["and", "of", "the", "to", "for", "with"]);

const SYNONYMS: Record<string, string> = {
  scraping: "excavation",
  scrape: "excavation",
  dispose: "removal",
  disposal: "removal",
  pourings: "pour",
  pouring: "pour",
  sqm: "m2",
  square: "m2",
};

const PUNCT_REGEX = /[^\w\s]/g;
const SPACE_REGEX = /\s+/g;

export function normalizeLineName(name: string): string {
  if (!name) return "";
  const lower = name.toLowerCase().replace(PUNCT_REGEX, " ");
  const tokens = lower
    .split(SPACE_REGEX)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((t) => SYNONYMS[t] ?? t)
    .filter((t) => !STOP_WORDS.has(t));

  return tokens.join(" ");
}
