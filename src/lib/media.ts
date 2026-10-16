import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";

/**
 * Uploaded images live outside the web root (UPLOAD_DIR) so a redeploy never wipes them,
 * and are served by /media/[id]. Each upload is re-encoded to WebP, which also strips
 * metadata and guarantees the file really is an image.
 */
export const uploadDir = () => path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "uploads"));

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);
const FULL_MAX = 2000;
const THUMB_MAX = 640;

const ID_RE = /^[a-z0-9]{20,32}$/i;
export const isMediaId = (id: string) => ID_RE.test(id);

const filePath = (id: string, thumb: boolean) => path.join(uploadDir(), `${id}${thumb ? "-t" : ""}.webp`);

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

  const row = await prisma.media.create({
    data: { mime: "image/webp", width: full.info.width, height: full.info.height, size: full.data.length, altText: altText?.slice(0, 200) || null },
  });
  try {
    await mkdir(uploadDir(), { recursive: true });
    await writeFile(filePath(row.id, false), full.data);
    await writeFile(filePath(row.id, true), thumb);
  } catch (err) {
    await prisma.media.delete({ where: { id: row.id } }).catch(() => null);
    throw err;
  }
  return row;
}

export async function readMediaFile(id: string, thumb: boolean): Promise<Buffer | null> {
  if (!isMediaId(id)) return null;
  try {
    return await readFile(filePath(id, thumb));
  } catch {
    return null;
  }
}

export async function deleteMediaFiles(id: string) {
  if (!isMediaId(id)) return;
  await Promise.all([rm(filePath(id, false), { force: true }), rm(filePath(id, true), { force: true })]);
}

export const mediaUrl = (id: string, thumb = false) => `/media/${id}${thumb ? "?t=1" : ""}`;
