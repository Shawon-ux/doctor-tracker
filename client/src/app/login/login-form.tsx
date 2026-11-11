"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { keys } from "@/hooks/queries";
import type { User } from "@/lib/types";
import { safeNext } from "@/lib/safe-next";


const DEMO = process.env.NEXT_PUBLIC_DEMO_LOGIN?.split(":");

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("reason") === "expired" ? "Your session ended. Sign in again to continue." : null,
  );
  const [pending, setPending] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const { user } = await api<{ user: User }>("/auth/login", { method: "POST", json: { email, password } });
      qc.setQueryData(keys.me, user);
      router.replace(safeNext(params.get("next")));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in. Try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 flex flex-col gap-4" noValidate>
      {error && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <Field label="Email">
        {(p) => <Input {...p} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />}
      </Field>
      <Field label="Password">
        {(p) => (
          <div className="relative">
            <Input {...p} type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-1.5 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded text-faint hover:text-ink"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        )}
      </Field>
      <Button type="submit" variant="primary" loading={pending} disabled={!email || !password} className="mt-2 h-10">
        Sign In
      </Button>
      {DEMO && DEMO.length >= 2 && (
        <button
          type="button"
          onClick={() => {
            setEmail(DEMO[0]!);
            setPassword(DEMO.slice(1).join(":"));
          }}
          className="text-sm text-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Use Demo Account
        </button>
      )}
    </form>
  );
}
