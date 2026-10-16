"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, errorMessage } from "@/components/billing/api";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { Button, inputClass, labelClass } from "@/components/ui/kit";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/login", { body: { email, password } });
      const next = params.get("next");
      // Only follow same-site admin paths.
      router.replace(next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-[20px] bg-paper p-7 shadow-2xl">
      <div className="flex flex-col items-center gap-3 text-center">
        <LogoMark size={72} />
        <Wordmark className="text-2xl" light={false} />
        <p className="text-sm text-slate-600">Sign in to manage quotations, invoices and clients.</p>
      </div>
      <div>
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="password">
          Password
        </label>
        <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
      </div>
      {error && (
        <p className="text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" busy={busy} className="w-full">
        Sign in
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="on-dark flex min-h-screen items-center justify-center bg-ink p-4" style={{ backgroundImage: "radial-gradient(ellipse at 30% 20%, rgba(182,242,58,0.12), transparent 55%)" }}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
