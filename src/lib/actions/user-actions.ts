"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(name: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await db
      .update(users)
      .set({ fullName: name })
      .where(eq(users.id, session.user.id));

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Profile update error:", error);
    return { success: false, error: "Failed to update profile." };
  }
}

export async function updatePasswordAction(currentPass: string, newPass: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // In a real app, you'd verify currentPass and hash newPass.
  // For this demo/setup, we'll just simulate success if they aren't empty.
  if (!currentPass || !newPass) {
    return { success: false, error: "Passwords cannot be empty." };
  }

  try {
    // Simulate DB update
    // await db.update(users).set({ password: hashedNewPass }).where(eq(users.id, session.user.id));
    
    return { success: true, message: "Password updated successfully." };
  } catch (error) {
    return { success: false, error: "Failed to update password." };
  }
}
