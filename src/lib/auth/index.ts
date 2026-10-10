import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "resin_admin_token";
const DEFAULT_SECRET = "resin-art-super-secure-admin-jwt-session-secret-key-32chars";
const SECRET_KEY = new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET || DEFAULT_SECRET);

export interface AdminSessionPayload {
  userId: string;
  email: string;
  role: string;
  fullName: string;
}

// In-memory admin store fallback (persists alongside database)
let inMemoryAdmins: Array<{
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: string;
}> = [];

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signAdminSession(payload: AdminSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifyAdminSession(token: string): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as AdminSessionPayload;
  } catch {
    return null;
  }
}

export async function setAdminSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function removeAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminSession(token);
}

export async function requireAdminAuth(): Promise<AdminSessionPayload> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("Unauthorized: Admin authentication required");
  }
  return session;
}

// ---------------- Admin User Management ----------------

export async function hasAnyAdmin(): Promise<boolean> {
  return inMemoryAdmins.length > 0;
}

export async function findAdminByEmail(email: string) {
  return inMemoryAdmins.find((a) => a.email.toLowerCase() === email.trim().toLowerCase()) || null;
}

export async function createAdminUser(data: {
  email: string;
  password: string;
  fullName: string;
  role?: string;
  setupKey?: string;
}) {
  const expectedKey = process.env.ADMIN_SETUP_KEY || "resin-art-admin-bootstrap-secret-2026";
  const existingCount = inMemoryAdmins.length;

  // If admins already exist, setupKey is strictly mandatory
  if (existingCount > 0 && data.setupKey !== expectedKey) {
    throw new Error("Invalid admin setup key.");
  }

  const existing = await findAdminByEmail(data.email);
  if (existing) {
    throw new Error("An administrator with this email already exists.");
  }

  const passwordHash = await hashPassword(data.password);
  const newAdmin = {
    id: `adm_${Date.now()}`,
    email: data.email.toLowerCase().trim(),
    passwordHash,
    fullName: data.fullName,
    role: data.role || (existingCount === 0 ? "owner" : "admin"),
  };

  inMemoryAdmins.push(newAdmin);
  return { id: newAdmin.id, email: newAdmin.email, fullName: newAdmin.fullName, role: newAdmin.role };
}
