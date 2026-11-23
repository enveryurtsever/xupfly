"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateSystemSettingAction(key: string, value: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Check if exists
    const [existing] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    if (existing) {
      await db
        .update(systemSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(systemSettings.key, key));
    } else {
      // Create it
      await db.insert(systemSettings).values({
        key,
        value,
        label: key, // Fallback
      });
    }

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Setting update error:", error);
    return { success: false, error: "Failed to update setting." };
  }
}
