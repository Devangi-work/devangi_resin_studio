import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import { neon } from "@neondatabase/serverless";

const SESSION_COOKIE_NAME = "resin_admin_token";
const DEFAULT_SECRET = "resin-art-super-secure-admin-jwt-session-secret-key-32chars";
const SECRET_KEY = new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET || DEFAULT_SECRET);

function getSql() {
  if (
    process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.includes("user:password@ep-sample") &&
    process.env.DATABASE_URL.startsWith("postgres")
  ) {
    return neon(process.env.DATABASE_URL);
  }
  return null;
}

export interface AdminSessionPayload {
  userId: string;
  email: string;
  role: string;
  fullName: string;
  avatarUrl?: string | null;
}

// In-memory admin store fallback (persists alongside database)
let inMemoryAdmins: Array<{
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: string;
}> = [
  {
    id: "adm_devangi",
    email: "devangiresin@gmail.com",
    passwordHash: "$2b$10$bvUvFqFVTWuAA9Lk7kaY9e7n1dJ5JX2XTPuWqK2wEaV79aR7LjTdS", // Deepa@04
    fullName: "Devangi Resin Studio Admin",
    role: "owner",
  },
  {
    id: "admin_primary",
    email: "admin@auraresinart.com",
    passwordHash: "$2b$10$rK3UeUj3yO0d03zY0kEWee7Z13U0mPZpM83a2p004f2jQo0oK.85u", // AdminSecret2025!
    fullName: "Devangi Resin Studio Admin",
    role: "owner",
  },
];

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
  const sql = getSql();
  if (sql) {
    try {
      const rows = await sql`SELECT COUNT(*) as count FROM admin_users;`;
      if (rows && Number(rows[0]?.count) > 0) return true;
    } catch {
      // fallback
    }
  }
  return inMemoryAdmins.length > 0;
}

export async function findAdminByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const sql = getSql();
  if (sql) {
    try {
      const rows = await sql`
        SELECT id, email, full_name as "fullName", password_hash as "passwordHash", role, avatar_url as "avatarUrl"
        FROM admin_users
        WHERE LOWER(email) = ${normalized}
        LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        return {
          id: rows[0].id,
          email: rows[0].email,
          fullName: rows[0].fullName,
          passwordHash: rows[0].passwordHash,
          role: rows[0].role,
          avatarUrl: rows[0].avatarUrl || null,
        };
      }
    } catch {
      // fallback
    }
  }
  const mem = inMemoryAdmins.find((a) => a.email.toLowerCase() === normalized);
  return mem ? { ...mem, avatarUrl: (mem as any).avatarUrl || null } : null;
}

export async function findAdminById(id: string) {
  const sql = getSql();
  if (sql) {
    try {
      const rows = await sql`
        SELECT id, email, full_name as "fullName", password_hash as "passwordHash", role, avatar_url as "avatarUrl"
        FROM admin_users
        WHERE id = ${id}
        LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        return {
          id: rows[0].id,
          email: rows[0].email,
          fullName: rows[0].fullName,
          role: rows[0].role,
          avatarUrl: rows[0].avatarUrl || null,
        };
      }
    } catch {
      // fallback
    }
  }
  const mem = inMemoryAdmins.find((a) => a.id === id);
  return mem ? { ...mem, avatarUrl: (mem as any).avatarUrl || null } : null;
}

export async function updateAdminAvatar(idOrEmail: string, avatarUrl: string) {
  const sql = getSql();
  if (sql) {
    try {
      await sql`
        UPDATE admin_users
        SET avatar_url = ${avatarUrl}, updated_at = NOW()
        WHERE id = ${idOrEmail} OR LOWER(email) = ${idOrEmail.toLowerCase()};
      `;
    } catch (e) {
      console.error("updateAdminAvatar DB error:", e);
    }
  }
  const mem = inMemoryAdmins.find((a) => a.id === idOrEmail || a.email.toLowerCase() === idOrEmail.toLowerCase());
  if (mem) {
    (mem as any).avatarUrl = avatarUrl;
  }
  return { success: true, avatarUrl };
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
