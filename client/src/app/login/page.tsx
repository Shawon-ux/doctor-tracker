import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandMark } from "@/components/layout/brand";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <span className="text-md font-semibold tracking-tight">Doctor Tracker</span>
        </div>
        <div className="my-auto w-full max-w-sm py-12">
          <h1 className="text-xl font-semibold tracking-tight">Sign In</h1>
          <p className="mt-1.5 text-muted">Admin access to doctors, patients and ward load.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
        <p className="text-xs text-faint">Access is restricted to clinic administrators.</p>
      </div>

      <div aria-hidden className="relative hidden overflow-hidden bg-pine lg:block">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
            backgroundSize: "80px 80px, 80px 80px, 16px 16px, 16px 16px",
          }}
        />
        <svg viewBox="0 0 800 200" preserveAspectRatio="none" className="absolute top-1/2 left-0 h-48 w-full -translate-y-1/2">
          <path
            d="M0 120 H210 l18 -14 l14 14 H300 l14 -90 l20 150 l16 -76 h24 l18 -20 l18 20 H560 l12 -10 l12 10 H800"
            fill="none"
            stroke="rgba(255,255,255,.9)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <p className="absolute bottom-12 left-12 max-w-sm text-lg leading-snug font-medium text-white/90">
          Every doctor, every patient, and who needs attention first.
        </p>
      </div>
    </div>
  );
}
