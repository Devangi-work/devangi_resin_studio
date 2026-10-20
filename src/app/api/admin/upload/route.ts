import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { uploadImageToBlob } from "@/lib/blob";

import { dbStore } from "@/lib/db";

export async function POST(request: Request) {
  try {
    await requireAdminAuth();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const upload = await uploadImageToBlob(file, file.name, "admin-media");

    // Automatically record every uploaded image asset in the Media Library
    const mediaItem = await dbStore.addMediaItem({
      fileName: file.name,
      url: upload.url,
      fileSize: file.size,
      mimeType: file.type || "image/png",
      altText: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
    });

    return NextResponse.json({
      success: true,
      url: upload.url,
      pathname: upload.pathname,
      mediaItem,
      isMock: upload.isMock,
    });
  } catch (err: any) {
    if (err.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
