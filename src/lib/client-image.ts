/**
 * Client-side image utility to normalize images before upload.
 * Automatically converts HEIC/HEIF files (e.g. from modern iPhones) to standard JPEG in the browser.
 * This ensures:
 * 1. Immediate visual previews work in any browser without broken images.
 * 2. Upload payloads are standard JPEG files compatible with storage, OCR, and all devices.
 */
export async function normalizeImageForUpload(file: File): Promise<File> {
  if (!file) return file;

  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.type === "image/heic-sequence" ||
    file.type === "image/heif-sequence" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif");

  if (!isHeic) {
    return file;
  }

  // If running in browser environment, convert using heic2any
  if (typeof window !== "undefined") {
    try {
      const heic2anyModule = await import("heic2any");
      const heic2any = heic2anyModule.default || heic2anyModule;
      const converted = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.9,
      });

      const singleBlob = Array.isArray(converted) ? converted[0] : converted;
      let newName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
      if (!newName.toLowerCase().endsWith(".jpg") && !newName.toLowerCase().endsWith(".jpeg")) {
        newName += ".jpg";
      }

      return new File([singleBlob], newName, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
    } catch (err) {
      console.warn("[normalizeImageForUpload] Browser HEIC conversion failed, will rely on server fallback:", err);
    }
  }

  return file;
}
