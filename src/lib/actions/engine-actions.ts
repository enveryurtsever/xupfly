"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { xAccounts, mentions, generatedPosts, automationRules, externalTweetLibrary, engineLogs } from "@/db/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { runMentionsWorker } from "@/lib/workers/mentions-worker";
import { runPublishWorker } from "@/lib/workers/publish-worker";
import { batchGeneratePosts } from "@/lib/ai/content-engine";
import { runSearchWorker } from "@/lib/workers/search-worker";
import { likeTweet } from "@/lib/x-api/official-client";
import { revalidatePath } from "next/cache";

export async function runFullEngineCycleAction() {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  try {
    console.log(`[Smart Engine] Decision cycle started for user: ${session.user.email}`);

    // 1. Get active accounts
    const accounts = await db
      .select()
      .from(xAccounts)
      .where(eq(xAccounts.ownerId, session.user.id));

    if (accounts.length === 0) return { success: false, error: "No accounts connected." };

    let actionsTaken = 0;

    for (const account of accounts) {
      // 2. Get rules for this account
      const [rules] = await db
        .select()
        .from(automationRules)
        .where(eq(automationRules.accountId, account.id))
        .limit(1);

      if (!rules || !account.automationEnabled) continue;

      // --- DECISION LOGIC ---

      // Priority A: Reply to new mentions (if auto-reply is on)
      if (rules.autoReply) {
        const pendingMentions = await db
          .select()
          .from(mentions)
          .where(and(eq(mentions.accountId, account.id), isNull(mentions.aiReplyId)))
          .limit(1);

        if (pendingMentions.length > 0) {
          console.log(`[Smart Engine] Decision: Reply to Mention for @${account.screenName}`);
          await runMentionsWorker(account.id); // Targeted run
          await db.insert(engineLogs).values({
            accountId: account.id,
            actionType: "reply",
            description: `Auto-replied to a mention from @${account.screenName}`
          });
          actionsTaken++;
          continue; // Move to next account or stop
        }
      }

      // Priority B: Publish approved posts
      const approvedPosts = await db
        .select()
        .from(generatedPosts)
        .where(and(eq(generatedPosts.accountId, account.id), eq(generatedPosts.status, "approved"), isNull(generatedPosts.publishedAt)))
        .limit(1);

      if (approvedPosts.length > 0) {
        console.log(`[Smart Engine] Decision: Publish Approved Post for @${account.screenName}`);
        await runPublishWorker(account.id); // Targeted run
        await db.insert(engineLogs).values({
          accountId: account.id,
          actionType: "post",
          description: "Published an approved post from the queue."
        });
        actionsTaken++;
        continue;
      }

      // Priority C: Interactive actions (Like or Generate)
      const randomAction = Math.random();
      
      if (randomAction > 0.5) {
        // Option 1: Generate 1 new post (Only if automation rules allow)
        console.log(`[Smart Engine] Decision: Generate New Content for @${account.screenName}`);
        
        // Ensure we have some FRESH trends first
        const [latestTrend] = await db
          .select({ lastUpdatedAt: externalTweetLibrary.lastUpdatedAt })
          .from(externalTweetLibrary)
          .orderBy(desc(externalTweetLibrary.lastUpdatedAt))
          .limit(1);

        const libraryCountRes = await db.select({ count: sql<number>`count(*)` }).from(externalTweetLibrary);
        const libraryCount = Number(libraryCountRes[0].count);
        
        const isOutdated = latestTrend 
          ? (Date.now() - new Date(latestTrend.lastUpdatedAt!).getTime() > 1000 * 60 * 60 * 12) 
          : true;

        if (libraryCount < 10 || isOutdated) {
          console.log(`[Smart Engine] Library is ${libraryCount < 10 ? "low" : "outdated"}. Running search worker...`);
          await runSearchWorker();
        }
        
        const genResult = await batchGeneratePosts(account.id, true); // Targeted run with hour bypass
        if (genResult.generated > 0) {
          await db.insert(engineLogs).values({
            accountId: account.id,
            actionType: "generate",
            description: "Generated a new AI post based on recent trends."
          });
          actionsTaken++;
        } else {
          await db.insert(engineLogs).values({
            accountId: account.id,
            actionType: "skip",
            description: "No new posts generated (Daily limit or No unused trends)."
          });
        }
      } else if (rules.autoLike && (rules.dailyLikeLimit || 0) > 0) {
        // Option 2: Find a tweet in library and LIKE it (Only if autoLike is enabled and limit > 0)
        
        // Check if we already reached the limit for today
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
        if (likesToday >= (rules.dailyLikeLimit || 0)) {
          console.log(`[Smart Engine] Like limit reached for @${account.screenName} (${likesToday}/${rules.dailyLikeLimit})`);
          // Fallback to generate if like limit reached
          const fbResult = await batchGeneratePosts(account.id, true);
          if (fbResult.generated > 0) {
            await db.insert(engineLogs).values({
              accountId: account.id,
              actionType: "generate",
              description: "Like limit reached, generated a fallback post instead."
            });
            actionsTaken++;
          }
          continue;
        }

        console.log(`[Smart Engine] Decision: Like a Tweet for @${account.screenName}`);
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
            description: `Liked a trending tweet in the library.`
          });
          actionsTaken++;
        } else {
          // Fallback to search if library empty
          await runSearchWorker();
          actionsTaken++;
        }
      } else {
        // Ensure we have some FRESH trends first
        const [fallbackLatestTrend] = await db
          .select({ lastUpdatedAt: externalTweetLibrary.lastUpdatedAt })
          .from(externalTweetLibrary)
          .orderBy(desc(externalTweetLibrary.lastUpdatedAt))
          .limit(1);

        const fbLibraryCountRes = await db.select({ count: sql<number>`count(*)` }).from(externalTweetLibrary);
        const fbLibraryCount = Number(fbLibraryCountRes[0].count);
        
        const fbIsOutdated = fallbackLatestTrend 
          ? (Date.now() - new Date(fallbackLatestTrend.lastUpdatedAt!).getTime() > 1000 * 60 * 60 * 12) 
          : true;

        if (fbLibraryCount < 10 || fbIsOutdated) {
          await runSearchWorker();
        }

        // Fallback: If no other action decided, just generate content
        const fbResult = await batchGeneratePosts(account.id, true); // Targeted run with hour bypass
        if (fbResult.generated > 0) {
          await db.insert(engineLogs).values({
            accountId: account.id,
            actionType: "generate",
            description: "No other actions pending, generated a fallback post."
          });
          actionsTaken++;
        } else {
           await db.insert(engineLogs).values({
            accountId: account.id,
            actionType: "skip",
            description: "Attempted fallback generation but nothing was produced."
          });
        }
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/posts");
    console.log(`[Smart Engine] Cycle completed successfully. Actions taken: ${actionsTaken}`);
    return { success: true, message: `Cycle completed. Actions taken: ${actionsTaken}` };
  } catch (error: any) {
    const errorDetails = error.response?.data || error.message;
    console.error("[Smart Engine] Cycle failed CRITICALLY:", errorDetails);
    return { success: false, error: `Engine failed: ${JSON.stringify(errorDetails)}` };
  }
}

export async function getEngineLogsAction() {
  const session = await auth();
  if (!session?.user) return [];

  const logs = await db
    .select({
      id: engineLogs.id,
      actionType: engineLogs.actionType,
      description: engineLogs.description,
      status: engineLogs.status,
      createdAt: engineLogs.createdAt,
      screenName: xAccounts.screenName,
    })
    .from(engineLogs)
    .innerJoin(xAccounts, eq(engineLogs.accountId, xAccounts.id))
    .where(eq(xAccounts.ownerId, session.user.id))
    .orderBy(desc(engineLogs.createdAt))
    .limit(5);

  return logs;
}
