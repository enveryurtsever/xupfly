import { db } from "@/db";
import { systemSettings, creditTransactions, pricingPlans } from "@/db/schema";
import { eq } from "drizzle-orm";

// ─── Default credit costs (used only if DB has no setting) ────────────────────
const DEFAULTS: Record<string, number> = {
  credit_cost_tweet: 5,
  credit_cost_reply: 3,
  credit_cost_retweet: 1,
  credit_cost_quote: 4,
  credit_cost_thread: 8,
  credit_cost_ai_generate: 2,
};

/** Reads a numeric setting from the system_settings table */
export async function getSetting(key: string): Promise<number> {
  const [row] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, key))
    .limit(1);

  if (!row) return DEFAULTS[key] ?? 0;
  return parseInt(row.value, 10);
}

/** Get all settings grouped by category */
export async function getAllSettings() {
  return db.select().from(systemSettings).orderBy(systemSettings.category);
}

/** Update a single setting (admin only) */
export async function updateSetting(key: string, value: string) {
  await db
    .update(systemSettings)
    .set({ value, updatedAt: new Date() })
    .where(eq(systemSettings.key, key));
}

/** Get all pricing plans */
export async function getPricingPlans() {
  return db.select().from(pricingPlans).orderBy(pricingPlans.priceUsd as never);
}
