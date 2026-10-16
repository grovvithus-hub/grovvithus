"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { MoreVertical, X } from "lucide-react";

export const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600";
export const cellInput =
  "w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-brand-600 focus:outline-none";
export const labelClass = "mb-1 block text-xs font-semibold text-slate-700";

export const Spinner = ({ className = "h-4 w-4" }: { className?: string }) => (
  <span className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} aria-label="Loading" />
);

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  size = "md",
  z = 50,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  z?: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const width = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-6xl" }[size];
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4" style={{ zIndex: z }} role="dialog" aria-modal="true">
      <div className={`flex max-h-[96vh] w-full ${width} flex-col overflow-hidden rounded-[20px] bg-white shadow-xl`}>
        <div className="flex items-center justify-between gap-3 bg-ink px-5 py-4 text-white">
          <div className="min-w-0">
            <h3 className="font-display truncate text-lg font-bold">{title}</h3>
            {subtitle && <p className="truncate text-xs text-mist">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-300 hover:text-white" title="Close" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-slate-200 bg-white px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  busy,
  disabled,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  busy?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const styles = {
    primary: "bg-lime text-ink hover:brightness-95",
    secondary: "bg-ink text-white hover:bg-brand-900",
    ghost: "border border-slate-300 text-slate-700 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      className={`flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-[filter,background-color] duration-150 disabled:opacity-60 ${styles} ${className}`}
    >
      {busy && <Spinner />}
      {children}
    </button>
  );
}

export function IconButton({
  title,
  icon: Icon,
  onClick,
  className = "",
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 ${className}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export interface MenuItem {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
  hidden?: boolean;
  danger?: boolean;
}

export function RowMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const visible = items.filter((i) => !i.hidden);
  return (
    <div className="relative" ref={ref}>
      <IconButton title="More actions" icon={MoreVertical} onClick={() => setOpen((o) => !o)} />
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {visible.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 ${item.danger ? "text-rose-600" : "text-slate-700"}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const StatusBadge = ({ label, cls }: { label: string; cls: string }) => (
  <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{label}</span>
);

export const PageHeader = ({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) => (
  <div className="flex flex-col items-start justify-between gap-4 on-dark rounded-[20px] bg-gradient-to-r from-ink to-brand-900 p-6 text-white shadow sm:flex-row sm:items-center">
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1 max-w-2xl text-xs text-mist">{subtitle}</p>
    </div>
    {action}
  </div>
);

export const StatCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    {sub && <p className="text-xs text-slate-500">{sub}</p>}
  </div>
);
