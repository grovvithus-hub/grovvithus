"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import type { BillingCompany } from "./types";
import { inputClass, labelClass } from "@/components/ui/kit";

/** Picks the issuing company ("Billed By"). Empty value means the default company. */
export function CompanySelect({
  value,
  onChange,
  onCompanyChange,
}: {
  value: string;
  onChange: (id: string) => void;
  onCompanyChange: (company: BillingCompany | null) => void;
}) {
  const [companies, setCompanies] = useState<BillingCompany[]>([]);

  useEffect(() => {
    api<BillingCompany[]>("/api/admin/companies").then(setCompanies).catch(() => setCompanies([]));
  }, []);

  const selected = companies.find((c) => c.id === value) || companies.find((c) => c.isDefault) || companies[0] || null;
  useEffect(() => {
    onCompanyChange(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, companies]);

  const options = companies.filter((c) => c.isActive || c.id === value);
  return (
    <div>
      <label className={labelClass}>Billed by (your company)</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        <option value="">{companies.find((c) => c.isDefault)?.name ? `${companies.find((c) => c.isDefault)!.name} (default)` : "Default company"}</option>
        {options
          .filter((c) => !c.isDefault)
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.isActive ? "" : " (inactive)"}
            </option>
          ))}
      </select>
      {companies.length === 0 && <p className="mt-1 text-xs text-amber-700">Set up your company in Billing settings first.</p>}
    </div>
  );
}
