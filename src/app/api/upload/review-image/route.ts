import { NextResponse } from "next/server";
import { uploadImageToBlob } from "@/lib/blob";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const upload = await uploadImageToBlob(file, file.name, "customer-reviews");
    return NextResponse.json({
      success: true,
      url: upload.url,
      pathname: upload.pathname,
      isMock: upload.isMock,
    });
  } catch (err: any) {
    console.error("[Review Image Upload Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

