import { prisma } from "@/lib/db";
import { isMediaId, readMediaFile } from "@/lib/media";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isMediaId(id)) return new Response("Not found", { status: 404 });
  const thumb = new URL(req.url).searchParams.get("t") === "1";
  const file = await readMediaFile(id, thumb);
  if (!file) return new Response("Not found", { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": "image/webp",
    "Content-Length": String(file.length),
    // The id never points at different bytes, so browsers and Cloudflare may keep it for a year.
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };
  // Alt text is not needed to serve the file; just confirm the row still exists (deleted uploads 404).
  if (!(await prisma.media.findUnique({ where: { id }, select: { id: true } }))) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file), { headers });
}
