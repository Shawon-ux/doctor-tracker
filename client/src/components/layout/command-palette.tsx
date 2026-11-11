"use client";

import { Dialog } from "radix-ui";
import { useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { Kbd } from "./kbd";
import { AlertTriangle, LayoutGrid, Search, Stethoscope, User, Users } from "lucide-react";
import { api, qs } from "@/lib/api";
import { useDoctorLookup } from "@/hooks/queries";
import { useDebounced } from "@/hooks/use-debounced";
import { CONDITION_META } from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { Paged, Patient } from "@/lib/types";

type Item = { id: string; group: string; label: string; hint?: string; icon: ReactNode; href: string };

const PAGES: Item[] = [
  { id: "p-overview", group: "Go To", label: "Overview", icon: <LayoutGrid size={16} />, href: "/" },
  { id: "p-doctors", group: "Go To", label: "Doctors", icon: <Stethoscope size={16} />, href: "/doctors" },
  { id: "p-patients", group: "Go To", label: "Patients", icon: <Users size={16} />, href: "/patients" },
  { id: "p-critical", group: "Go To", label: "Critical Patients", icon: <AlertTriangle size={16} />, href: "/patients?condition=critical" },
];

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[#0b1418]/45 data-[state=open]:animate-[fade_120ms_ease-out]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-[12vh] left-1/2 z-50 w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-20px_rgba(10,30,35,0.45)] focus:outline-none data-[state=open]:animate-[rise_160ms_cubic-bezier(.2,.8,.2,1)]"
        >
          <Dialog.Title className="sr-only">Search</Dialog.Title>
          {open && <Palette onClose={() => onOpenChange(false)} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Palette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const dq = useDebounced(q.trim(), 200);

  const doctors = useDoctorLookup(dq, dq.length > 0);
  const patients = useQuery({
    queryKey: ["patients", "palette", dq],
    queryFn: () => api<Paged<Patient>>(`/patients${qs({ q: dq, limit: 6 })}`),
    enabled: dq.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const term = q.trim().toLowerCase();
  const items: Item[] = [
    ...PAGES.filter((p) => !term || p.label.toLowerCase().includes(term)),
    ...(dq
      ? (doctors.data ?? []).slice(0, 5).map((d) => ({
          id: `d-${d._id}`,
          group: "Doctors",
          label: d.name,
          hint: d.specialization,
          icon: <Stethoscope size={16} />,
          href: `/doctors/${d._id}`,
        }))
      : []),
    ...(dq
      ? (patients.data?.items ?? []).map((p) => ({
          id: `pt-${p._id}`,
          group: "Patients",
          label: p.name,
          hint: `${p.diagnosis}, ${p.releasedAt ? "released" : CONDITION_META[p.condition].label.toLowerCase()}`,
          icon: <User size={16} />,
          href: `/patients?patient=${p._id}`,
        }))
      : []),
  ];
  const current = Math.min(active, Math.max(0, items.length - 1));
  const loading = !!dq && (doctors.isFetching || patients.isFetching);

  const go = (it?: Item) => {
    if (!it) return;
    onClose();
    router.push(it.href);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((current + 1) % Math.max(1, items.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((current - 1 + items.length) % Math.max(1, items.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(items[current]);
    }
  };

  let lastGroup = "";
  return (
    <>
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search size={18} className="shrink-0 text-faint" />
        <input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKey}
          placeholder="Search doctors and patients, or jump to a page"
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-activedescendant={items[current] ? `${listId}-${items[current].id}` : undefined}
          maxLength={100}
          className="h-14 w-full bg-transparent text-md outline-none placeholder:text-faint focus-visible:outline-none"
        />
        {loading && <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-faint border-r-transparent" aria-hidden />}
      </div>
      <ul id={listId} role="listbox" aria-label="Results" className="max-h-[min(60vh,26rem)] overflow-y-auto p-2">
        {items.length === 0 && !loading && <li className="px-3 py-8 text-center text-sm text-muted">Nothing matches “{q.trim()}”</li>}
        {items.map((it, i) => {
          const header = it.group !== lastGroup ? it.group : null;
          lastGroup = it.group;
          return (
            <li key={it.id} role="presentation">
              {header && <p className="px-3 pt-2 pb-1 text-xs font-medium text-faint">{header}</p>}
              <div
                id={`${listId}-${it.id}`}
                role="option"
                aria-selected={i === current}
                onMouseMove={() => i !== current && setActive(i)}
                onClick={() => go(it)}
                className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2", i === current ? "bg-surface-2 text-ink" : "text-ink")}
              >
                <span className="text-muted">{it.icon}</span>
                <span className="min-w-0 flex-1 truncate">{it.label}</span>
                {it.hint && <span className="hidden max-w-[45%] truncate text-sm text-muted sm:block">{it.hint}</span>}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="hidden items-center gap-4 border-t border-line px-4 py-2 text-xs text-faint sm:flex">
        <span><Kbd>↑</Kbd> <Kbd>↓</Kbd> to move</span>
        <span><Kbd>Enter</Kbd> to open</span>
        <span><Kbd>Esc</Kbd> to close</span>
      </div>
    </>
  );
}

