import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth/customer";
import { dbStore } from "@/lib/db";
import { uploadImageToBlob } from "@/lib/blob";

export async function POST(request: Request) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No avatar image provided." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files (JPEG, PNG, WebP) are allowed." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Avatar image must be under 5MB." }, { status: 400 });
    }

    const upload = await uploadImageToBlob(file, file.name, "customer-avatars");

    // Update customer avatar in database
    await dbStore.updateCustomerProfile(session.customerId, { avatarUrl: upload.url });

    return NextResponse.json({
      success: true,
      avatarUrl: upload.url,
    });
  } catch (err: any) {
    console.error("[Customer Avatar Upload Error]", err);
    return NextResponse.json({ error: err.message || "Failed to upload avatar" }, { status: 500 });
  }
}
