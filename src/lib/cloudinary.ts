export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const cloudinaryConfigured = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET
);

// Cloudinary files live under one of three resource types; audio is
// uploaded as "video" (Cloudinary has no separate audio type), and
// anything else (pdf, vcf, our messages.json, ...) goes under "raw".
export type CloudinaryResourceType = "image" | "video" | "raw";

export function resourceTypeForKind(
  kind: "image" | "video" | "audio" | "document" | null
): CloudinaryResourceType {
  if (kind === "image") return "image";
  if (kind === "video" || kind === "audio") return "video";
  return "raw";
}

export async function uploadToCloudinary(
  blob: Blob,
  fileName: string,
  resourceType: CloudinaryResourceType,
  folder: string
): Promise<{ url: string; bytes: number }> {
  if (!cloudinaryConfigured) {
    throw new Error(
      "Cloudinary isn't configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET."
    );
  }

  const form = new FormData();
  form.append("file", blob, fileName);
  form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET!);
  form.append("folder", folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
  const res = await fetch(endpoint, { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Cloudinary upload failed (${res.status}): ${detail}`);
  }
  const data = await res.json();
  return { url: data.secure_url as string, bytes: data.bytes as number };
}
