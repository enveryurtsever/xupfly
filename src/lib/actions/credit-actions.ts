"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { creditTransactions, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function purchasePlanAction(planId: string, credits: number, price: number) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // In a real app, you'd integrate Stripe/Paypal here.
    // For now, we simulate a successful purchase.
    
    await db.transaction(async (tx) => {
      // 1. Add transaction
      await tx.insert(creditTransactions).values({
        userId: session.user.id,
        amount: credits,
        type: "PURCHASE",
        description: `Plan Purchase: ${credits} credits`,
      });

      // 2. Update user balance
      await tx
        .update(users)
        .set({ totalCredits: sql`${users.totalCredits} + ${credits}` })
        .where(eq(users.id, session.user.id));
    });

    revalidatePath("/dashboard/credits");
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Purchase error:", error);
    return { success: false, error: "Failed to process purchase." };
  }
}
