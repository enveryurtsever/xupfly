import { db } from "@/db";
import { users, creditTransactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSetting } from "@/lib/settings-service";

export type ActionType = "tweet" | "reply" | "retweet" | "quote" | "thread" | "ai_generate";

/** Map action types to system_settings keys */
const COST_KEY_MAP: Record<ActionType, string> = {
  tweet: "credit_cost_tweet",
  reply: "credit_cost_reply",
  retweet: "credit_cost_retweet",
  quote: "credit_cost_quote",
  thread: "credit_cost_thread",
  ai_generate: "credit_cost_ai_generate",
};

/**
 * Check if user has enough credits for an action, then atomically deduct them.
 * Returns { success: true, remaining } if deducted, or { success: false, reason } if not.
 */
export async function checkAndDeduct(
  userId: string,
  accountId: string | null,
  action: ActionType,
  customDescription?: string
): Promise<{ success: boolean; remaining?: number; reason?: string }> {
  const costKey = COST_KEY_MAP[action];
  const cost = await getSetting(costKey);

  // Atomic check + deduct in a transaction
  return await db.transaction(async (tx) => {
    // Lock the user row
    const [user] = await tx
      .select({ totalCredits: users.totalCredits })
      .from(users)
      .where(eq(users.id, userId))
      .for("update")
      .limit(1);

    if (!user) return { success: false, reason: "User not found" };

    const currentCredits = user.totalCredits ?? 0;
    if (currentCredits < cost) {
      return {
        success: false,
        reason: `Insufficient credits. Need ${cost}, have ${currentCredits}.`,
      };
    }

    const newBalance = currentCredits - cost;

    // Deduct credits
    await tx
      .update(users)
      .set({
        totalCredits: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Log the transaction
    await tx.insert(creditTransactions).values({
      userId,
      accountId,
      amount: -cost,
      type: "USAGE",
      description: customDescription ?? `Action: ${action} (cost: ${cost} credits)`,
    });

    return { success: true, remaining: newBalance };
  });
}

/**
 * Add credits to a user (purchase / bonus / refund).
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: "PURCHASE" | "BONUS" | "REFUND",
  description: string,
  accountId?: string
): Promise<number> {
  return await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(users)
      .set({
        totalCredits: sql`${users.totalCredits} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ totalCredits: users.totalCredits });

    await tx.insert(creditTransactions).values({
      userId,
      accountId: accountId ?? null,
      amount,
      type,
      description,
    });

    return updated?.totalCredits ?? 0;
  });
}

/** Get credit balance for a user */
export async function getCreditBalance(userId: string): Promise<number> {
  const [user] = await db
    .select({ totalCredits: users.totalCredits })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user?.totalCredits ?? 0;
}
