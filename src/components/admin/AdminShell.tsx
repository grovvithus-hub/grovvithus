"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, FolderOpen, LayoutDashboard, LogOut, Menu, Receipt, Settings, Users, UserSquare2, X } from "lucide-react";
import { api } from "@/components/billing/api";
import { BrandLockup } from "@/components/brand/Logo";

const BILLING = ["SUPER_ADMIN", "SALES"];
const CONTENT = ["SUPER_ADMIN", "EDITOR"];

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/leads", label: "Leads", icon: UserSquare2, roles: BILLING },
  { href: "/admin/quotations", label: "Quotations", icon: FileText, roles: BILLING },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt, roles: BILLING },
  { href: "/admin/clients", label: "Clients", icon: Users, roles: BILLING },
  { href: "/admin/portfolio", label: "Portfolio", icon: FolderOpen, roles: CONTENT },
  { href: "/admin/settings/billing", label: "Billing settings", icon: Settings, roles: ["SUPER_ADMIN"] },
];

export function AdminShell({ user, children }: { user: { name: string; email: string; role: string }; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST", body: {} }).catch(() => null);
    router.replace("/admin/login");
    router.refresh();
  };

  const items = NAV.filter((n) => !n.roles || n.roles.includes(user.role));

  const nav = (
    <nav className="space-y-1 px-3 py-4" aria-label="Admin">
      {items.map((n) => {
        const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ${active ? "bg-lime text-ink" : "text-mist hover:bg-brand-900 hover:text-white"}`}
          >
            <n.icon className="h-4 w-4" /> {n.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="on-dark-shell min-h-screen bg-paper md:flex">
      <aside className="on-dark hidden w-64 shrink-0 flex-col bg-ink md:flex">
        <div className="px-5 py-5">
          <BrandLockup markSize={40} className="text-xl" />
          <p className="mt-1 whitespace-nowrap pl-[3.1rem] text-[9px] font-semibold uppercase tracking-[0.2em] text-mist">Build &middot; Market &middot; Scale</p>
        </div>
        {nav}
        <div className="mt-auto border-t border-brand-900 p-4 text-xs text-mist">
          <div className="truncate font-semibold text-white">{user.name}</div>
          <div className="truncate">{user.email}</div>
          <button onClick={logout} className="mt-3 flex items-center gap-2 font-semibold text-mist hover:text-white">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="on-dark flex items-center justify-between bg-ink px-4 py-3 text-white md:hidden">
          <BrandLockup markSize={32} className="text-lg" />
          <button onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>
        {open && (
          <div className="on-dark bg-ink md:hidden">
            {nav}
            <button onClick={logout} className="flex items-center gap-2 px-6 pb-4 text-sm font-semibold text-mist">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        )}
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
