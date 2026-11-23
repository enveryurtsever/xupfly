"use server";

import { auth } from "@/auth";
import { checkAndDeduct } from "@/lib/credits/credit-service";
import { runSearchWorker } from "@/lib/workers/search-worker";
import { manualGeneratePosts } from "@/lib/ai/content-engine";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { niches, searchConfigs } from "@/db/schema";

export async function triggerManualGeneration(
  nicheId: string,
  accountId: string,
  language?: string,
  location?: string,
  customNicheName?: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    let finalNicheId = nicheId;

    // Handle "Other" niche
    if (nicheId === "other" && customNicheName) {
      const { db } = await import("@/db");
      const { niches } = await import("@/db/schema");
      const { eq } = await import("drizzle-orm");
      
      // Check if it already exists
      const [existingNiche] = await db
        .select()
        .from(niches)
        .where(eq(niches.name, customNicheName.trim()));

      if (existingNiche) {
        finalNicheId = existingNiche.id;
      } else {
        const [newNiche] = await db
          .insert(niches)
          .values({
            name: customNicheName.trim(),
            description: `Custom niche created during generation by user ${session.user.email}`,
          })
          .returning();
        finalNicheId = newNiche.id;

        // Create a default search config for the new niche
        await db.insert(searchConfigs).values({
          nicheId: finalNicheId,
          queryTerm: customNicheName.trim(),
          languageFilter: language || "en",
          isActive: true,
        });
      }
    }
    console.log(`[Manual Gen] Niche: ${finalNicheId}, Custom: ${customNicheName}`);

    // 1. Check and deduct credits (AI generation cost)
    const deduction = await checkAndDeduct(
      session.user.id,
      accountId,
      "ai_generate",
      "Manual AI Generation Cycle (5 posts)"
    );

    if (!deduction.success) {
      return { success: false, error: deduction.reason };
    }

    // 2. Run search worker for this niche to get fresh source content (Rapid API call)
    console.log(`[Manual Gen] Running search worker for niche ${finalNicheId}...`);
    const searchResult = await runSearchWorker(finalNicheId, language, location, accountId);
    console.log(`[Manual Gen] Search finished. Inserted: ${searchResult.inserted}, Errors: ${searchResult.errors.length}`);

    // 3. Generate 5 new posts
    console.log(`[Manual Gen] Generating posts for account ${accountId}...`);
    const result = await manualGeneratePosts(accountId, 5);
    console.log(`[Manual Gen] Generation finished. Generated: ${result.generated}, Errors: ${result.errors.length}`);

    if (result.generated === 0) {
      console.log(`[Manual Gen] FAILED: No posts generated. Errors:`, result.errors);
      // If we couldn't generate anything, maybe refund? 
      // For now we just return error.
      return { 
        success: false, 
        error: "Failed to generate any posts. Please try a different niche or wait a few minutes." 
      };
    }

    revalidatePath("/dashboard/generate");
    revalidatePath("/dashboard");

    return { 
      success: true, 
      generated: result.generated,
      remainingCredits: deduction.remaining 
    };
  } catch (error) {
    console.error("Manual generation error:", error);
    return { success: false, error: "An unexpected error occurred during generation." };
  }
}
