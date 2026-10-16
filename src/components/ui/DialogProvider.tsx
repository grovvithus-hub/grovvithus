"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type Variant = "info" | "success" | "warning" | "danger" | "error";

interface DialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  variant?: Variant;
}

interface DialogApi {
  confirm: (opts: DialogOptions) => Promise<boolean>;
  alert: (opts: DialogOptions) => Promise<void>;
}

const Ctx = createContext<DialogApi | null>(null);

export const useDialog = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDialog must be used inside DialogProvider");
  return ctx;
};

const buttonByVariant: Record<Variant, string> = {
  info: "bg-lime !text-ink hover:brightness-95",
  success: "bg-lime !text-ink hover:brightness-95",
  warning: "bg-amber-600 hover:bg-amber-700",
  danger: "bg-rose-600 hover:bg-rose-700",
  error: "bg-rose-600 hover:bg-rose-700",
};

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(DialogOptions & { kind: "confirm" | "alert" }) | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const open = useCallback(
    (kind: "confirm" | "alert", opts: DialogOptions) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setState({ ...opts, kind });
      }),
    [],
  );

  const close = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setState(null);
  };

  const api: DialogApi = {
    confirm: (opts) => open("confirm", opts),
    alert: async (opts) => {
      await open("alert", opts);
    },
  };

  return (
    <Ctx.Provider value={api}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">{state.title}</h3>
            <p className="mt-2 whitespace-pre-line break-words text-sm text-slate-600">{state.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              {state.kind === "confirm" && (
                <button onClick={() => close(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
              )}
              <button
                autoFocus
                onClick={() => close(true)}
                className={`rounded-lg px-4 py-2 text-sm font-bold text-white ${buttonByVariant[state.variant || "info"]}`}
              >
                {state.confirmText || "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
