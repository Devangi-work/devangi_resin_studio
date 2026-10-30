import { NextResponse } from "next/server";
import { uploadImageToBlob } from "@/lib/blob";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Security validation on MIME type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files (JPEG, PNG, WebP) are allowed." }, { status: 400 });
    }

    // Size limit check: 10MB max
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Receipt image exceeds 10MB limit." }, { status: 400 });
    }

    // Upload to Blob storage
    const upload = await uploadImageToBlob(file, file.name, "payment-receipts");

    return NextResponse.json({
      success: true,
      url: upload.url,
      pathname: upload.pathname,
      isMock: upload.isMock,
    });
  } catch (err: any) {
    console.error("[Payment Receipt Upload Error]", err);
    return NextResponse.json({ error: err.message || "Failed to process receipt" }, { status: 500 });
  }
}
