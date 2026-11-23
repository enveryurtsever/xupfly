"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function toggleUserStatusAction(userId: string, currentStatus: boolean) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await db
      .update(users)
      .set({ isActive: !currentStatus, updatedAt: new Date() })
      .where(eq(users.id, userId));

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Toggle user status error:", error);
    return { success: false, error: "Failed to update user status." };
  }
}

export async function deleteUserAction(userId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await db
      .delete(users)
      .where(eq(users.id, userId));

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Delete user error:", error);
    return { success: false, error: "Failed to delete user." };
  }
}
