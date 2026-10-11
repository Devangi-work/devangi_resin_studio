import { NextResponse } from "next/server";
import { uploadImageToBlob } from "@/lib/blob";
import { extractReceiptDetails } from "@/lib/ocr/upi-receipt";

export const maxDuration = 60; // Allow sufficient time for OCR processing

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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Upload to Blob storage
    const upload = await uploadImageToBlob(file, file.name, "payment-receipts");

    // 2. Extract OCR Details (UTR, Amount, Payee, Status)
    const ocrDetails = await extractReceiptDetails(buffer);

    return NextResponse.json({
      success: true,
      url: upload.url,
      pathname: upload.pathname,
      isMock: upload.isMock,
      detectedUtr: ocrDetails.detectedUtr,
      detectedAmount: ocrDetails.detectedAmount,
      detectedDate: ocrDetails.detectedDate,
      detectedApp: ocrDetails.detectedApp,
      payeeMatched: ocrDetails.payeeMatched,
      statusMatched: ocrDetails.statusMatched,
      rawText: ocrDetails.rawText,
    });
  } catch (err: any) {
    console.error("[Payment Receipt Upload Error]", err);
    return NextResponse.json({ error: err.message || "Failed to process receipt" }, { status: 500 });
  }
}
