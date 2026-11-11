"use client";

import { useEffect, useState } from "react";

/**
 * False for the first `ms` after the page becomes visible. Pages hold their skeleton
 * this long, so even a cached page arrives with the same short loading beat.
 * Next keeps visited routes mounted but hidden (React Activity) and re-runs effects
 * when they are shown again, so the reset lives in the cleanup.
 */
export function useMinDelay(ms = 350) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), ms);
    return () => {
      clearTimeout(t);
      setDone(false);
    };
  }, [ms]);
  return done;
}
