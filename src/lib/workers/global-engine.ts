import { db } from "@/db";
import { xAccounts, automationRules, mentions, generatedPosts, externalTweetLibrary, engineLogs } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { runMentionsWorker } from "@/lib/workers/mentions-worker";
import { runPublishWorker } from "@/lib/workers/publish-worker";
import { batchGeneratePosts } from "@/lib/ai/content-engine";
import { runSearchWorker } from "@/lib/workers/search-worker";
import { likeTweet } from "@/lib/x-api/official-client";

/**
 * The core otonom engine that runs for ALL active accounts in the system.
 * This is intended to be called by a cron job every 15-60 minutes.
 */
export async function runGlobalEngine() {
  const currentHour = new Date().getHours();
  console.log(`[Global Engine] Starting autonomous cycle for hour: ${currentHour}`);

  // 1. Get all accounts that have automation enabled
  const activeAccounts = await db
    .select()
    .from(xAccounts)
    .where(eq(xAccounts.automationEnabled, true));

  console.log(`[Global Engine] Found ${activeAccounts.length} active accounts.`);

  for (const account of activeAccounts) {
    try {
      // 2. Get automation rules
      const [rules] = await db
        .select()
        .from(automationRules)
        .where(eq(automationRules.accountId, account.id))
        .limit(1);

      if (!rules) continue;

      // 3. Check Preferred Hours
      if (rules.preferredHours && rules.preferredHours.length > 0) {
        if (!rules.preferredHours.includes(currentHour)) {
          console.log(`[Global Engine] Skipping @${account.screenName}: Current hour ${currentHour} is not in preferred list.`);
          continue;
        }
      }

      console.log(`[Global Engine] Processing @${account.screenName}...`);

      // --- SMART DECISION LOGIC (Same as manual but global) ---

      // Priority 1: Reply to mentions
      if (rules.autoReply) {
        const pendingMentions = await db
          .select()
          .from(mentions)
          .where(and(eq(mentions.accountId, account.id), isNull(mentions.aiReplyId)))
          .limit(1);

        if (pendingMentions.length > 0) {
          console.log(`[Global Engine] Action: Auto-Reply for @${account.screenName}`);
          await runMentionsWorker(account.id); 
          continue;
        }
      }

      // Priority 2: Publish approved posts
      const approvedPosts = await db
        .select()
        .from(generatedPosts)
        .where(and(
          eq(generatedPosts.status, "approved"), 
          isNull(generatedPosts.publishedAt),
          eq(generatedPosts.accountId, account.id)
        ))
        .limit(1);

      if (approvedPosts.length > 0) {
        console.log(`[Global Engine] Action: Publish for @${account.screenName}`);
        await runPublishWorker(account.id);
        continue;
      }

      // Priority 3: Engagement (Generate or Like)
      const randomAction = Math.random();
      
      if (randomAction > 0.5) {
        console.log(`[Global Engine] Action: Generate for @${account.screenName}`);
        // Ensure library has content
        const libraryCount = await db.select({ count: sql<number>`count(*)` }).from(externalTweetLibrary);
        if (Number(libraryCount[0].count) < 5) await runSearchWorker();
        
        await batchGeneratePosts(account.id);
      } else if (rules.autoLike && (rules.dailyLikeLimit || 0) > 0) {
        // Check if limit reached for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [likeCountResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(engineLogs)
          .where(
            and(
              eq(engineLogs.accountId, account.id),
              eq(engineLogs.actionType, "like"),
              sql`${engineLogs.createdAt} >= ${today}`
            )
          );
        
        const likesToday = Number(likeCountResult?.count || 0);
        if (likesToday < (rules.dailyLikeLimit || 0)) {
          console.log(`[Global Engine] Action: Like for @${account.screenName}`);
          const [randomTweet] = await db
            .select()
            .from(externalTweetLibrary)
            .orderBy(sql`RANDOM()`)
            .limit(1);

          if (randomTweet) {
            await likeTweet(account, randomTweet.tweetId);
            await db.insert(engineLogs).values({
              accountId: account.id,
              actionType: "like",
              description: "Otonom cycle: Liked a trending tweet."
            });
          } else {
            await runSearchWorker();
          }
        } else {
          // If like limit reached, fallback to generate
          await batchGeneratePosts(account.id);
        }
      } else {
        // Fallback to generate
        await batchGeneratePosts(account.id);
      }

    } catch (err) {
      console.error(`[Global Engine] Error processing @${account.screenName}:`, err);
    }
  }

  console.log("[Global Engine] Cycle finished.");
}
