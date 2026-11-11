const MAX_TOKENS = 40;

/** Lowercased word tokens stored on each document so anchored prefix regexes can use the multikey index. */
export function toKeywords(...values: (string | undefined | null)[]): string[] {
  const set = new Set<string>();
  for (const v of values) {
    if (!v) continue;
    for (const t of v.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
      if (t) set.add(t);
    }
  }
  return [...set].slice(0, MAX_TOKENS);
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Builds `{ keywords: { $all: [/^tok/...] } }` so every typed word must prefix-match some stored word. */
export function keywordFilter(q: string | undefined) {
  const tokens = toKeywords(q).slice(0, 5);
  if (!tokens.length) return {};
  return { keywords: { $all: tokens.map((t) => new RegExp(`^${escapeRegex(t)}`)) } };
}
