import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, creditTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

/** GET /api/admin/users — list all users */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      totalCredits: users.totalCredits,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
  return NextResponse.json(allUsers);
}

/** PATCH /api/admin/users — toggle active or update credits */
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, isActive, totalCredits } = await request.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof isActive === "boolean") updateData.isActive = isActive;
  if (typeof totalCredits === "number") updateData.totalCredits = totalCredits;

  await db.update(users).set(updateData as never).where(eq(users.id, userId));
  return NextResponse.json({ success: true });
}
