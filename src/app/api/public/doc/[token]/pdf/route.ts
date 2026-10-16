import { clientIp, route } from "@/lib/http";
import { documentFileName, loadByToken, renderPdf } from "@/lib/billing/documents";
import { rateLimit } from "@/lib/ratelimit";

export const GET = route<{ token: string }>({}, async (req, { params }) => {
  rateLimit(`pubpdf:${clientIp(req)}`, 30, 60_000);
  const { kind, record, company } = await loadByToken(params.token);
  const pdf = await renderPdf(kind, record, company);
  const download = new URL(req.url).searchParams.get("download") === "1";
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.length),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${documentFileName(kind, record)}"`,
      "Cache-Control": "private, no-store",
    },
  });
});
