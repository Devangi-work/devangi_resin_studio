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

  let uploadBuffer: Buffer | null = null;
  let finalContentType = file.type || "image/jpeg";
  let finalFilename = filename;

  if (isHeic) {
    let converted = false;
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    let outputBuffer: Buffer | null = null;

    // Step 1: Direct libheif-js wasm decoding (broadest Apple iPhone format compatibility: heic, heix, mif1, msf1, MiPr, MiHE, heim, heis)
    try {
      const libheifModule = await import("libheif-js/wasm-bundle" as any);
      const libheif = libheifModule.default || libheifModule;
      if (libheif.ready) await libheif.ready;

      const decoder = new libheif.HeifDecoder();
      const decodedImages = decoder.decode(inputBuffer);
      if (decodedImages && decodedImages.length > 0) {
        const primaryImage = decodedImages[0];
        const width = primaryImage.get_width();
        const height = primaryImage.get_height();

        const displayData = await new Promise<{ data: Uint8ClampedArray }>((resolve, reject) => {
          primaryImage.display({ data: new Uint8ClampedArray(width * height * 4), width, height }, (res: any) => {
            if (!res) reject(new Error("libheif frame display returned null"));
            else resolve(res);
          });
        });

        // Free native wasm resources
        for (const img of decodedImages) {
          try { img.free(); } catch {}
        }
        try { decoder.decoder.delete(); } catch {}

        // Encode decoded RGBA frame to high-quality JPEG
        const rawRgbaBuffer = Buffer.from(displayData.data.buffer, displayData.data.byteOffset, displayData.data.byteLength);
        try {
          const sharpModule = await import("sharp");
          const sharp = sharpModule.default || sharpModule;
          outputBuffer = await sharp(rawRgbaBuffer, {
            raw: { width, height, channels: 4 },
          })
            .rotate()
            .jpeg({ quality: 90, mozjpeg: true })
            .toBuffer();
          converted = true;
        } catch {
          const jpegJsModule = await import("jpeg-js");
          const jpegJs = jpegJsModule.default || jpegJsModule;
          const encoded = jpegJs.encode({ data: rawRgbaBuffer, width, height }, 90);
          outputBuffer = Buffer.from(encoded.data);
          converted = true;
        }
      }
    } catch (libheifErr) {
      console.warn("[uploadImageToBlob] libheif-js wasm decode failed, trying heic-convert fallback:", libheifErr);
    }

    // Step 2: heic-convert fallback
    if (!converted) {
      try {
        const heicConvertModule = await import("heic-convert");
        const heicConvert = heicConvertModule.default || heicConvertModule;
        const resBuffer = await heicConvert({
          buffer: inputBuffer,
          format: "JPEG",
          quality: 0.90,
        });

        outputBuffer = Buffer.isBuffer(resBuffer) ? resBuffer : Buffer.from(resBuffer as ArrayBuffer);
        converted = true;
      } catch (fallbackErr) {
        console.warn("[uploadImageToBlob] heic-convert fallback failed:", fallbackErr);
      }
    }

    // Step 3: Sharp native fallback
    if (!converted) {
      try {
        const sharpModule = await import("sharp");
        const sharp = sharpModule.default || sharpModule;
        outputBuffer = await sharp(inputBuffer)
          .rotate()
          .jpeg({ quality: 90, mozjpeg: true })
          .toBuffer();
        converted = true;
      } catch (sharpErr) {
        console.warn("[uploadImageToBlob] Sharp native fallback failed:", sharpErr);
      }
    }

    if (converted && outputBuffer) {
      finalFilename = filename.replace(/\.(heic|heif)$/i, ".jpg");
      if (!finalFilename.toLowerCase().endsWith(".jpg") && !finalFilename.toLowerCase().endsWith(".jpeg")) {
        finalFilename += ".jpg";
      }
      uploadBuffer = outputBuffer;
      finalContentType = "image/jpeg";
    } else {
      finalFilename = filename.replace(/\.(heic|heif)$/i, ".jpg");
      if (!finalFilename.toLowerCase().endsWith(".jpg") && !finalFilename.toLowerCase().endsWith(".jpeg")) {
        finalFilename += ".jpg";
      }
      uploadBuffer = inputBuffer;
      finalContentType = "image/jpeg";
    }
  } else {
    const arrayBuffer = await file.arrayBuffer();
    uploadBuffer = Buffer.from(arrayBuffer);
    finalContentType = file.type || "image/jpeg";
  }

  const sanitizedFilename = finalFilename.toLowerCase().replace(/[^a-z0-9._-]/g, "_");
  const pathname = `${prefix}/${Date.now()}-${sanitizedFilename}`;

  if (!isBlobConfigured()) {
    // Development / fallback: return data URL
    const base64 = uploadBuffer.toString("base64");
    const mime = finalContentType && !finalContentType.includes("heic") && !finalContentType.includes("heif") ? finalContentType : "image/jpeg";
    const dataUrl = `data:${mime};base64,${base64}`;

    return {
      url: dataUrl,
      pathname,
      isMock: true,
    };
  }

  const blob = await put(pathname, uploadBuffer, {
    access: "public",
    token: BLOB_READ_WRITE_TOKEN,
    contentType: finalContentType,
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
