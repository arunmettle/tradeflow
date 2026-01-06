const TOKEN_REGEX = /\s+/g;

export function tokenize(value: string): string[] {
  return value
    .split(TOKEN_REGEX)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export function tokenJaccardSimilarity(a: string, b: string): number {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 && setB.size === 0) return 1;
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}
