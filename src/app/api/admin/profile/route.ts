import { NextResponse } from "next/server";
import { getAdminSession, findAdminById, findAdminByEmail, updateAdminAvatar } from "@/lib/auth";
import { dbStore } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin =
    (await findAdminById(session.userId)) ||
    (await findAdminByEmail(session.email));

  return NextResponse.json({
    admin: {
      id: session.userId,
      email: session.email,
      fullName: admin?.fullName || session.fullName,
      role: session.role,
      avatarUrl: admin?.avatarUrl || null,
    },
  });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  // Handle direct file upload
  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No image file provided." }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });

      const ext = path.extname(file.name) || ".png";
      const cleanBase = path
        .basename(file.name, ext)
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .toLowerCase();
      const uniqueFileName = `admin_avatar_${Date.now()}_${cleanBase}${ext}`;
      const filePath = path.join(uploadsDir, uniqueFileName);

      await writeFile(filePath, buffer);
      const avatarUrl = `/uploads/${uniqueFileName}`;

      // Register in media library
      try {
        await dbStore.addMediaItem({
          fileName: uniqueFileName,
          url: avatarUrl,
          altText: `Admin Avatar - ${session.fullName}`,
          fileSize: buffer.length,
          mimeType: file.type || "image/png",
        });
      } catch (err) {
        console.error("Auto media register error for avatar:", err);
      }

      // Update admin avatar in DB
      await updateAdminAvatar(session.userId, avatarUrl);
      if (session.email) {
        await updateAdminAvatar(session.email, avatarUrl);
      }

      return NextResponse.json({
        success: true,
        avatarUrl,
        message: "Admin avatar updated successfully.",
      });
    } catch (err: any) {
      console.error("Admin profile upload error:", err);
      return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
    }
  }

  // Handle JSON payload (e.g. choosing from media library)
  try {
    const body = await req.json();
    const { avatarUrl } = body;

    if (!avatarUrl) {
      return NextResponse.json({ error: "avatarUrl is required" }, { status: 400 });
    }

    await updateAdminAvatar(session.userId, avatarUrl);
    if (session.email) {
      await updateAdminAvatar(session.email, avatarUrl);
    }

    return NextResponse.json({
      success: true,
      avatarUrl,
      message: "Admin avatar updated successfully.",
    });
  } catch (err: any) {
    console.error("Admin profile JSON update error:", err);
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
