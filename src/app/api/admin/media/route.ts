import { CONTENT_ROLES } from "@/lib/auth";
import { AppError, ok, route } from "@/lib/http";
import { saveImage, mediaUrl } from "@/lib/media";

/** Upload one or more images (multipart field "files"). Returns the saved media rows. */
export const POST = route({ roles: CONTENT_ROLES }, async (req) => {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new AppError("Upload failed. Please try again.", 400);
  }
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) throw new AppError("Choose at least one image", 400);
  if (files.length > 12) throw new AppError("Upload at most 12 images at a time", 400);

  const saved = [];
  for (const file of files) {
    const row = await saveImage(Buffer.from(await file.arrayBuffer()), file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    saved.push({ ...row, url: mediaUrl(row.id), thumbUrl: mediaUrl(row.id, true) });
  }
  return ok(saved, 201);
});
