"use client";

import { useMe } from "./queries";

/** UI mirror of the API rule: only admins write. The API enforces it regardless. */
export function useCanEdit() {
  const { data } = useMe();
  return data?.role === "admin";
}
