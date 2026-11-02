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

  let uploadFile: File | Blob = file;
  let finalFilename = filename;

  if (isHeic) {
    try {
      // Convert HEIC/HEIF to universal browser-compatible JPEG so it renders in all browsers
      const heicConvert = (await import("heic-convert")).default || (await import("heic-convert"));
      const arrayBuffer = await file.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);
      const outputBuffer = await heicConvert({
        buffer: inputBuffer,
        format: "JPEG",
        quality: 0.92,
      });

      finalFilename = filename.replace(/\.(heic|heif)$/i, ".jpg");
      if (!finalFilename.toLowerCase().endsWith(".jpg") && !finalFilename.toLowerCase().endsWith(".jpeg")) {
        finalFilename += ".jpg";
      }

      uploadFile = new Blob([new Uint8Array(outputBuffer as ArrayBuffer)], { type: "image/jpeg" });
    } catch (conversionErr) {
      console.warn("[uploadImageToBlob] HEIC to JPEG conversion note:", conversionErr);
      finalFilename = filename.replace(/\.(heic|heif)$/i, ".jpg");
    }
  }

  const sanitizedFilename = finalFilename.toLowerCase().replace(/[^a-z0-9._-]/g, "_");
  const pathname = `${prefix}/${Date.now()}-${sanitizedFilename}`;

  if (!isBlobConfigured()) {
    // Development / fallback: convert to data URL or return development mock URL
    const arrayBuffer = await uploadFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mime = uploadFile.type && !uploadFile.type.includes("heic") && !uploadFile.type.includes("heif") ? uploadFile.type : "image/jpeg";
    const dataUrl = `data:${mime};base64,${base64}`;

    return {
      url: dataUrl,
      pathname,
      isMock: true,
    };
  }

  const blob = await put(pathname, uploadFile, {
    access: "public",
    token: BLOB_READ_WRITE_TOKEN,
    contentType: uploadFile.type || "image/jpeg",
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
