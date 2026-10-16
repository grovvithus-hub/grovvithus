import sharp, { type Metadata } from "sharp";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";

/**
 * Uploaded images are stored in the database (full size and thumbnail), so they survive redeploys on hosts
 * with no persistent disk (Render), are included in database backups, and need no extra storage service.
 * Each upload is re-encoded to WebP, which also strips metadata and guarantees the file really is an image.
 * They are served, with long caching, by /media/[id].
 */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);
const FULL_MAX = 2000;
const THUMB_MAX = 640;

const ID_RE = /^[a-z0-9]{20,32}$/i;
export const isMediaId = (id: string) => ID_RE.test(id);

export async function saveImage(input: Buffer, altText?: string | null) {
  if (input.length > MAX_UPLOAD_BYTES) throw new AppError("Image is too large (max 10 MB)", 413);

  let meta: Metadata;
  try {
    meta = await sharp(input, { failOn: "error", limitInputPixels: 80_000_000 }).metadata();
  } catch {
    throw new AppError("That file is not a valid image", 400);
  }
  // SVG, GIF, TIFF and anything else is refused: only formats we re-encode safely are accepted.
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) throw new AppError("Use a JPEG, PNG or WebP image", 400);

  const full = await sharp(input).rotate().resize(FULL_MAX, FULL_MAX, { fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  const thumb = await sharp(input).rotate().resize(THUMB_MAX, THUMB_MAX, { fit: "inside", withoutEnlargement: true }).webp({ quality: 76 }).toBuffer();

  return prisma.media.create({
    data: {
      mime: "image/webp",
      width: full.info.width,
      height: full.info.height,
      size: full.data.length,
      altText: altText?.slice(0, 200) || null,
      data: new Uint8Array(full.data),
      thumb: new Uint8Array(thumb),
    },
    select: { id: true, mime: true, width: true, height: true, size: true, altText: true, createdAt: true },
  });
}

export async function readMediaFile(id: string, thumb: boolean): Promise<Buffer | null> {
  if (!isMediaId(id)) return null;
  const row = await prisma.media.findUnique({ where: { id }, select: thumb ? { thumb: true } : { data: true } });
  if (!row) return null;
  const bytes = thumb ? (row as { thumb: Uint8Array }).thumb : (row as { data: Uint8Array }).data;
  return Buffer.from(bytes);
}

export const mediaUrl = (id: string, thumb = false) => `/media/${id}${thumb ? "?t=1" : ""}`;
