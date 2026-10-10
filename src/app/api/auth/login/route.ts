import { NextResponse } from "next/server";
import { adminLoginSchema } from "@/lib/validations";
import { findAdminByEmail, verifyPassword, signAdminSession, setAdminSessionCookie, hasAnyAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = adminLoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const admin = await findAdminByEmail(email);

    // If no admin registered yet, guide them to /admin/setup
    const hasAdmin = await hasAnyAdmin();
    if (!hasAdmin) {
      return NextResponse.json(
        {
          error: "No administrator account exists yet. Please complete one-time setup at /admin/setup.",
          needsSetup: true,
        },
        { status: 400 }
      );
    }

    if (!admin) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = await signAdminSession({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
      fullName: admin.fullName,
    });

    await setAdminSessionCookie(token);

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    });
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}
