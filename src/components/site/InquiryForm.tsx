"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { apiRaw, errorMessage } from "@/components/billing/api";

const OPTIONS = [
  { value: "QUOTE", label: "Request a quote", hint: "We reply with a personal quotation." },
  { value: "DEMO", label: "Book a demo", hint: "A short walkthrough of how we work." },
  { value: "CALL", label: "Discuss on a call", hint: "Tell us a good time and we will call." },
] as const;

const SERVICES = ["Website development", "WordPress", "Shopify store", "Custom software", "Mobile app", "SEO / AEO / GEO", "Digital marketing", "Video editing", "Posters and creatives", "Logo and branding", "Maintenance", "Not sure yet"];

export function InquiryForm({ defaultService = "", defaultIntent = "QUOTE" }: { defaultService?: string; defaultIntent?: (typeof OPTIONS)[number]["value"] }) {
  const [intent, setIntent] = useState<(typeof OPTIONS)[number]["value"]>(defaultIntent);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setBusy(true);
    setError("");
    try {
      await apiRaw("/api/public/inquiry", { body: { ...data, intent } });
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="s-card p-8 text-center" role="status" style={{ borderColor: "var(--s-accent-text)" }}>
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 s-accent-text" />
        <h3 className="text-2xl font-bold">Thank you!</h3>
        <p className="s-muted mt-2">We have your message and will contact you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="s-card space-y-5 p-6 sm:p-8" aria-label="Contact form">
      <fieldset>
        <legend className="s-muted mb-2 text-sm font-semibold">How would you like to start?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {OPTIONS.map((o) => (
            <label
              key={o.value}
              className={`cursor-pointer rounded-2xl border px-4 py-3 text-left transition-colors duration-150 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 ${intent === o.value ? "border-transparent bg-[var(--s-accent)] text-[var(--s-accent-ink)]" : "s-border hover:border-[var(--s-accent-text)]"}`}
            >
              <input type="radio" name="intent-choice" value={o.value} checked={intent === o.value} onChange={() => setIntent(o.value)} className="sr-only" />
              <span className="block text-sm font-bold">{o.label}</span>
              <span className={`block text-xs ${intent === o.value ? "opacity-75" : "s-muted"}`}>{o.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="s-muted block text-sm font-semibold">Your name
          <input name="clientName" required autoComplete="name" className="field mt-1" />
        </label>
        <label className="s-muted block text-sm font-semibold">Business name
          <input name="companyName" autoComplete="organization" className="field mt-1" />
        </label>
        <label className="s-muted block text-sm font-semibold">Email
          <input name="email" type="email" required autoComplete="email" className="field mt-1" />
        </label>
        <label className="s-muted block text-sm font-semibold">Phone / WhatsApp
          <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" className="field mt-1" />
        </label>
        <label className="s-muted block text-sm font-semibold">What do you need?
          <select name="serviceOfInterest" defaultValue={defaultService} className="field mt-1">
            <option value="">Choose a service</option>
            {SERVICES.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </label>
        <label className="s-muted block text-sm font-semibold">When do you want to start?
          <select name="timeline" defaultValue="" className="field mt-1">
            <option value="">Choose a timeline</option>
            {["Immediately", "1 to 3 months", "3 to 6 months", "Just exploring"].map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </label>
      </div>
      <label className="s-muted block text-sm font-semibold">Tell us about your project
        <textarea name="projectDetails" rows={4} className="field mt-1" placeholder="Your goal, what you have today, and anything we should know." />
      </label>
      {/* Honeypot: hidden from people, filled by bots. */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      {error && <p className="text-sm text-rose-500" role="alert">{error}</p>}
      <button type="submit" disabled={busy} className="btn-lime w-full text-base disabled:opacity-60 sm:w-auto">
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {OPTIONS.find((o) => o.value === intent)!.label}
      </button>
      <p className="s-muted text-xs">
        We never show a price list. We explain how pricing works for your project and send a personal quotation. By sending this form you agree to be contacted about your enquiry, as described in our{" "}
        <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </form>
  );
}
