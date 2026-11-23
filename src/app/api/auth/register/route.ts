import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getSetting } from "@/lib/settings-service";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
  }

  const { email, password, fullName } = parsed.data;

  // Check if email already exists
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Get starter credit amount from system settings
  const starterCredits = await getSetting("starter_credits");

  await db.insert(users).values({
    email,
    passwordHash,
    fullName: fullName ?? null,
    role: "customer",
    totalCredits: starterCredits || 100,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
