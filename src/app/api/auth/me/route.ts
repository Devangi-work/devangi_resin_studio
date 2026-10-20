import { NextResponse } from "next/server";
import { getAdminSession, findAdminById, findAdminByEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const liveAdmin =
    (await findAdminById(session.userId)) ||
    (await findAdminByEmail(session.email));

  return NextResponse.json({
    authenticated: true,
    user: {
      ...session,
      fullName: liveAdmin?.fullName || session.fullName,
      avatarUrl: liveAdmin?.avatarUrl || session.avatarUrl || null,
    },
  });
}

