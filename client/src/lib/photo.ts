import type { Doctor } from "./types";

export const MAX_PHOTO_INPUT = 10 * 1024 * 1024;

/** Photo URL for a doctor, or undefined when none was added. photoAt busts the long-lived cache on change. */
export const doctorPhotoUrl = (d: Pick<Doctor, "_id" | "photoAt">) =>
  d.photoAt ? `/api/doctors/${d._id}/photo?v=${Date.parse(d.photoAt)}` : undefined;

/** Center-crops to a square and re-encodes as a small JPEG, so uploads stay around 20-40 KB. */
export async function resizeToJpeg(file: File, size = 320): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.min(size, side);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process the image");
  ctx.fillStyle = "#fff"; // JPEG has no transparency
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new Error("Could not process the image");
  return blob;
}
