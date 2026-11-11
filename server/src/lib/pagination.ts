import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export function sortSpec<T extends string>(sort: string | undefined, allowed: readonly T[], fallback: string) {
  const raw = sort && allowed.includes(sort.replace(/^-/, '') as T) ? sort : fallback;
  const field = raw.replace(/^-/, '');
  const dir = raw.startsWith('-') ? -1 : 1;
  // _id tiebreaker keeps page boundaries stable when sort keys repeat.
  return { [field]: dir, _id: dir } as Record<string, 1 | -1>;
}

export const pageMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  pages: Math.max(1, Math.ceil(total / limit)),
});

export const dateRange = (field: string, from?: Date, to?: Date) => {
  if (!from && !to) return {};
  const r: Record<string, Date> = {};
  if (from) r.$gte = from;
  if (to) r.$lte = to;
  return { [field]: r };
};
