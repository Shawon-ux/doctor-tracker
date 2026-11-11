"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * Filters, search and page live in the URL, so a filtered view can be bookmarked,
 * shared and restored with the back button. Any change other than `page` resets to page 1.
 */
export function useUrlState() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const get = useCallback((key: string) => params.get(key) ?? undefined, [params]);

  const set = useCallback(
    (patch: Record<string, string | number | undefined | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === null || v === "") next.delete(k);
        else next.set(k, String(v));
      }
      if (!("page" in patch)) next.delete("page");
      const s = next.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const clear = useCallback((keys: string[]) => set(Object.fromEntries(keys.map((k) => [k, undefined]))), [set]);

  return { params, get, set, clear };
}
