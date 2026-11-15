import { put, del } from "@vercel/blob";

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || "";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
  "application/octet-stream",
  "",
];
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

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
  if (!ALLOWED_IMAGE_TYPES.includes(file.type) && !isHeic && !file.type?.startsWith("image/")) {
    throw new Error(`Unsupported file type: ${file.type || "unknown"}. Allowed: JPEG, PNG, WEBP, GIF, HEIC.`);
  }

  // Validate file size (15MB max)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds the 15MB maximum limit.`);
  }

  let uploadFile: File | Blob = file;
  let finalFilename = filename;

  if (isHeic) {
    let converted = false;
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Primary: Sharp native libheif conversion (fast, supports iPhone HDR/burst/Live and EXIF auto-rotation)
    try {
      const sharpModule = await import("sharp");
      const sharp = sharpModule.default || sharpModule;
      const outputBuffer = await sharp(inputBuffer)
        .rotate()
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer();

      finalFilename = filename.replace(/\.(heic|heif)$/i, ".jpg");
      if (!finalFilename.toLowerCase().endsWith(".jpg") && !finalFilename.toLowerCase().endsWith(".jpeg")) {
        finalFilename += ".jpg";
      }

      uploadFile = new Blob([new Uint8Array(outputBuffer)], { type: "image/jpeg" });
      converted = true;
    } catch (sharpErr) {
      console.warn("[uploadImageToBlob] Sharp HEIC conversion attempt failed, trying heic-convert fallback:", sharpErr);
    }

    // Secondary fallback: heic-convert
    if (!converted) {
      try {
        const heicConvertModule = await import("heic-convert");
        const heicConvert = heicConvertModule.default || heicConvertModule;
        const outputBuffer = await heicConvert({
          buffer: inputBuffer,
          format: "JPEG",
          quality: 0.90,
        });

        finalFilename = filename.replace(/\.(heic|heif)$/i, ".jpg");
        if (!finalFilename.toLowerCase().endsWith(".jpg") && !finalFilename.toLowerCase().endsWith(".jpeg")) {
          finalFilename += ".jpg";
        }

        uploadFile = new Blob([new Uint8Array(outputBuffer as ArrayBuffer)], { type: "image/jpeg" });
        converted = true;
      } catch (fallbackErr) {
        console.warn("[uploadImageToBlob] heic-convert fallback failed:", fallbackErr);
      }
    }

    // Fallback 3: In case file was already a JPEG/PNG disguised with .heic extension
    if (!converted) {
      try {
        const sharpModule = await import("sharp");
        const sharp = sharpModule.default || sharpModule;
        const outputBuffer = await sharp(inputBuffer).rotate().jpeg({ quality: 90 }).toBuffer();
        finalFilename = filename.replace(/\.(heic|heif)$/i, ".jpg");
        uploadFile = new Blob([new Uint8Array(outputBuffer)], { type: "image/jpeg" });
        converted = true;
      } catch {
        finalFilename = filename.replace(/\.(heic|heif)$/i, ".jpg");
      }
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
