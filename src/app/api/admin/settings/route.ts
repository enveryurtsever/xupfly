import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { addCredits } from "@/lib/credits/credit-service";
import { updateSetting, getAllSettings } from "@/lib/settings-service";
import { z } from "zod";

const addCreditsSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().positive(),
  type: z.enum(["BONUS", "REFUND", "PURCHASE"]),
  description: z.string().default("Admin credit override"),
});

const updateSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
});

/** GET /api/admin/settings — list all system settings */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const settings = await getAllSettings();
  return NextResponse.json(settings);
}

/** PATCH /api/admin/settings — update a single setting */
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  // Handle credit adjustment
  if (body.userId) {
    const parsed = addCreditsSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const newBalance = await addCredits(
      parsed.data.userId,
      parsed.data.amount,
      parsed.data.type,
      parsed.data.description
    );
    return NextResponse.json({ success: true, newBalance });
  }

  // Handle setting update
  const parsed = updateSettingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  await updateSetting(parsed.data.key, parsed.data.value);
  return NextResponse.json({ success: true });
}
