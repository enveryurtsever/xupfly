"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { xAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteAccountAction(accountId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await db
      .delete(xAccounts)
      .where(eq(xAccounts.id, accountId));

    revalidatePath("/dashboard/accounts");
    return { success: true };
  } catch (error) {
    console.error("Account delete error:", error);
    return { success: false, error: "Failed to delete account." };
  }
}

export async function syncAccountAction(accountId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Simulate sync
    await db
      .update(xAccounts)
      .set({ updatedAt: new Date() })
      .where(eq(xAccounts.id, accountId));

    revalidatePath("/dashboard/accounts");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Sync failed." };
  }
}

export async function updateAccountSettingsAction(
  accountId: string,
  data: {
    automationEnabled: boolean;
    dailyPostLimit: number;
    dailyReplyLimit: number;
    dailyLikeLimit: number;
    autoReply: boolean;
    autoLike: boolean;
    smartRetweet: boolean;
    aiWelcome: boolean;
    nicheId: string;
    customNicheName?: string;
    searchKeywords?: string;
    preferredHours?: number[];
    engagementRules?: {
      autoReply: boolean;
      autoLike: boolean;
      smartRetweet: boolean;
      aiWelcome: boolean;
    };
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    let finalNicheId = data.nicheId;

    // Handle "Other" niche
    if (data.nicheId === "other" && data.customNicheName) {
      const { niches } = await import("@/db/schema");
      
      // Check if it already exists
      const [existingNiche] = await db
        .select()
        .from(niches)
        .where(eq(niches.name, data.customNicheName.trim()));

      if (existingNiche) {
        finalNicheId = existingNiche.id;
      } else {
        const [newNiche] = await db
          .insert(niches)
          .values({
            name: data.customNicheName.trim(),
            description: `Custom niche created by user ${session.user.email}`,
          })
          .returning();
        finalNicheId = newNiche.id;

        // Create a default search config for the new niche
        const { searchConfigs } = await import("@/db/schema");
        await db.insert(searchConfigs).values({
          nicheId: finalNicheId,
          queryTerm: data.customNicheName.trim(),
          languageFilter: "en",
          isActive: true,
        });
      }
    }

    // Update Account
    await db
      .update(xAccounts)
      .set({
        nicheId: finalNicheId === "none" ? null : finalNicheId,
        automationEnabled: data.automationEnabled,
        updatedAt: new Date(),
      })
      .where(eq(xAccounts.id, accountId));

    // Update or Insert Rules
    const { automationRules } = await import("@/db/schema");
    const [existingRules] = await db
      .select()
      .from(automationRules)
      .where(eq(automationRules.accountId, accountId));

    if (existingRules) {
      await db
        .update(automationRules)
        .set({
          dailyPostLimit: data.dailyPostLimit,
          dailyReplyLimit: data.dailyReplyLimit,
          dailyLikeLimit: data.dailyLikeLimit,
          autoReply: data.autoReply,
          autoLike: data.autoLike,
          smartRetweet: data.smartRetweet,
          aiWelcome: data.aiWelcome,
          searchKeywords: data.searchKeywords,
          preferredHours: data.preferredHours,
          updatedAt: new Date(),
        })
        .where(eq(automationRules.accountId, accountId));
    } else {
      await db
        .insert(automationRules)
        .values({
          accountId,
          dailyPostLimit: data.dailyPostLimit,
          dailyReplyLimit: data.dailyReplyLimit,
          dailyLikeLimit: data.dailyLikeLimit,
          autoReply: data.autoReply,
          autoLike: data.autoLike,
          smartRetweet: data.smartRetweet,
          aiWelcome: data.aiWelcome,
          searchKeywords: data.searchKeywords,
          preferredHours: data.preferredHours,
          aiTone: "professional and minimalist",
        });
    }

    revalidatePath(`/dashboard/accounts/${accountId}/settings`);
    return { success: true };
  } catch (error) {
    console.error("Update settings error:", error);
    return { success: false, error: "Failed to update settings." };
  }
}
