// Browser-side helpers for talking to the admin API.

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function apiRaw(path: string, init: { method?: string; body?: unknown } = {}) {
  const res = await fetch(path, {
    method: init.method || (init.body !== undefined ? "POST" : "GET"),
    headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    credentials: "same-origin",
    cache: "no-store",
  });
  let json: { status?: string; message?: string; data?: unknown; errors?: { message: string }[] } = {};
  try {
    json = await res.json();
  } catch {
    /* empty body */
  }
  if (res.status === 401 && typeof window !== "undefined" && !path.startsWith("/api/auth/")) {
    // A full page load on purpose: it clears any stale client state after the session ends.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
  }
  if (!res.ok) {
    const detail = json.errors && json.errors.length > 1 ? json.errors.map((e) => e.message).join("\n") : json.message;
    throw new ApiError(detail || `Request failed (${res.status})`, res.status);
  }
  return json;
}

export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  return (await apiRaw(path, init)).data as T;
}

export const errorMessage = (err: unknown, fallback = "Something went wrong. Please try again.") =>
  err instanceof Error && err.message ? err.message : fallback;

export type DocType = "quotations" | "invoices";

const pdfUrl = (type: DocType, id: string, download = false) =>
  `/api/admin/documents/${type}/${id}/pdf${download ? "?download=1" : ""}`;

export const openPdf = async (type: DocType, id: string) => {
  window.open(pdfUrl(type, id), "_blank", "noopener");
};

export const downloadPdf = async (type: DocType, id: string, fileName: string) => {
  const res = await fetch(pdfUrl(type, id, true), { credentials: "same-origin" });
  if (!res.ok) throw new Error("Could not download the PDF");
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

export const printPdf = async (type: DocType, id: string) => {
  const res = await fetch(pdfUrl(type, id), { credentials: "same-origin" });
  if (!res.ok) throw new Error("Could not load the PDF to print");
  const url = URL.createObjectURL(await res.blob());
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  frame.src = url;
  frame.onload = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => {
      frame.remove();
      URL.revokeObjectURL(url);
    }, 60_000);
  };
  document.body.appendChild(frame);
};

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
};
