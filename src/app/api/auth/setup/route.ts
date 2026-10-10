import { NextResponse } from "next/server";
import { adminSetupSchema } from "@/lib/validations";
import { createAdminUser, signAdminSession, setAdminSessionCookie, hasAnyAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = adminSetupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, fullName, setupKey } = result.data;
    const admin = await createAdminUser({
      email,
      password,
      fullName,
      setupKey,
    });

    const token = await signAdminSession({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
      fullName: admin.fullName,
    });

    await setAdminSessionCookie(token);

    return NextResponse.json({
      success: true,
      admin,
      message: "Admin account initialized successfully.",
    });
  } catch (error: any) {
    console.error("Admin setup error:", error);
    return NextResponse.json({ error: error.message || "Setup failed." }, { status: 400 });
  }
}

export async function GET() {
  const hasAdmin = await hasAnyAdmin();
  return NextResponse.json({
    needsSetup: !hasAdmin,
  });
}
