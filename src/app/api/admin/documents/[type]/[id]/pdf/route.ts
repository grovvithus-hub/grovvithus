import { BILLING_ROLES } from "@/lib/auth";
import { route } from "@/lib/http";
import { documentFileName, kindFromParam, loadDocument, renderPdf } from "@/lib/billing/documents";

export const GET = route<{ type: string; id: string }>({ roles: BILLING_ROLES }, async (req, { params }) => {
  const kind = kindFromParam(params.type);
  const { record, company } = await loadDocument(kind, params.id);
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
