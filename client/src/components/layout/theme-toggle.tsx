"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className }: { className?: string }) {
  const toggle = () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    const next = dark ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };
  return (
    <button onClick={toggle} aria-label="Switch colour theme" title="Switch colour theme" className={className}>
      <Sun size={16} className="theme-sun" />
      <Moon size={16} className="theme-moon" />
    </button>
  );
}
