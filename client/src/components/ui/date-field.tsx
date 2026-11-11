"use client";

import { CalendarDays } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { controlClass } from "./field";
import { dmyToIso, isoToDmy } from "@/lib/date";

/** Inserts the dashes as digits are typed: 0511 -> 05-11. */
const mask = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join("-");
};

/**
 * Date input that always reads DD-MM-YYYY, whatever the browser's locale. Native date
 * inputs follow the browser language, which a page cannot override. Value in and out is
 * ISO (YYYY-MM-DD) or "" while incomplete. The calendar button opens the native picker.
 */
export function DateField({
  value,
  onChange,
  min,
  max,
  id,
  className,
  "aria-invalid": invalid,
  "aria-describedby": describedBy,
  "aria-label": label,
}: {
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  id?: string;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-label"?: string;
}) {
  const [text, setText] = useState(isoToDmy(value));
  const [synced, setSynced] = useState(value);
  // Value changed from outside (preset, clear, picker): show it.
  if (value !== synced) {
    setSynced(value);
    if (dmyToIso(text) !== value) setText(isoToDmy(value));
  }
  const picker = useRef<HTMLInputElement>(null);

  return (
    <div className={cn("relative", className)}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="DD-MM-YYYY"
        maxLength={10}
        value={text}
        aria-invalid={invalid || (text.length === 10 && !dmyToIso(text)) || undefined}
        aria-describedby={describedBy}
        aria-label={label}
        onChange={(e) => {
          const next = mask(e.target.value);
          setText(next);
          const iso = dmyToIso(next);
          if (iso || next === "") {
            setSynced(iso);
            onChange(iso);
          }
        }}
        className={cn(controlClass, "num h-9 pr-9")}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={() => picker.current?.showPicker?.()}
        className="absolute top-1/2 right-1.5 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded text-faint hover:text-ink"
      >
        <CalendarDays size={15} />
      </button>
      <input
        ref={picker}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          setText(isoToDmy(e.target.value));
          setSynced(e.target.value);
          onChange(e.target.value);
        }}
        className="pointer-events-none absolute right-0 bottom-0 h-0 w-0 opacity-0"
      />
    </div>
  );
}
