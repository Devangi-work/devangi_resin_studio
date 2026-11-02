import { put, del } from "@vercel/blob";

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || "";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export function isBlobConfigured(): boolean {
  return Boolean(
    BLOB_READ_WRITE_TOKEN &&
    !BLOB_READ_WRITE_TOKEN.includes("placeholder") &&
    BLOB_READ_WRITE_TOKEN.length > 20
  );
}

export async function uploadImageToBlob(
  file: File | Blob,
  filename: string,
  prefix = "products"
): Promise<{ url: string; pathname: string; isMock: boolean }> {
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.type === "image/heic-sequence" ||
    file.type === "image/heif-sequence" ||
    filename.toLowerCase().endsWith(".heic") ||
    filename.toLowerCase().endsWith(".heif");

  // Validate MIME type or HEIC extension
  if (!ALLOWED_IMAGE_TYPES.includes(file.type) && !isHeic) {
    throw new Error(`Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WEBP, GIF, HEIC.`);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds the 5MB maximum limit.`);
  }

  const sanitizedFilename = filename.toLowerCase().replace(/[^a-z0-9._-]/g, "_");
  const pathname = `${prefix}/${Date.now()}-${sanitizedFilename}`;

  if (!isBlobConfigured()) {
    // Development / fallback: convert to data URL or return development mock URL
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mime = isHeic ? (file.type && file.type.startsWith("image/") ? file.type : "image/heic") : (file.type || "image/png");
    const dataUrl = `data:${mime};base64,${base64}`;

    return {
      url: dataUrl,
      pathname,
      isMock: true,
    };
  }

  const blob = await put(pathname, file, {
    access: "public",
    token: BLOB_READ_WRITE_TOKEN,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    isMock: false,
  };
}

export async function deleteBlobObject(pathnameOrUrl: string) {
  if (!isBlobConfigured() || !pathnameOrUrl) {
    return true;
  }
  try {
    await del(pathnameOrUrl, { token: BLOB_READ_WRITE_TOKEN });
    return true;
  } catch (err) {
    console.error("Vercel Blob deletion error:", err);
    return false;
  }
}
