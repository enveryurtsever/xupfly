import { db } from "@/db";
import { xAccounts, mentions, automationRules, generatedPosts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getMentions, replyToTweet } from "@/lib/x-api/official-client";
import { generateReplyToMention } from "@/lib/ai/content-engine";

/**
 * Worker to poll for recent mentions and optionally auto-reply.
 */
export async function runMentionsWorker(targetAccountId?: string) {
  console.log("[Mentions Worker] Starting check cycle...");

  // 1. Get accounts with automation enabled
  const query = db
    .select()
    .from(xAccounts);

  const accounts = await (targetAccountId
    ? query.where(and(eq(xAccounts.automationEnabled, true), eq(xAccounts.id, targetAccountId)))
    : query.where(eq(xAccounts.automationEnabled, true)));

  for (const account of accounts) {
    try {
      console.log(`[Mentions Worker] Checking @${account.screenName}...`);

      // Get latest mention ID we have in DB to use as sinceId
      const [lastMention] = await db
        .select({ externalId: mentions.externalId })
        .from(mentions)
        .where(eq(mentions.accountId, account.id))
        .orderBy(desc(mentions.createdAt))
        .limit(1);

      const timeline = await getMentions(account, lastMention?.externalId || undefined);
      
      if (!timeline.data || timeline.data.data.length === 0) {
        console.log(`[Mentions Worker] No new mentions for @${account.screenName}`);
        continue;
      }

      const users = timeline.includes?.users || [];
      const newMentions = timeline.data.data;

      for (const tweet of newMentions) {
        // Find author info
        const author = users.find((u: any) => u.id === tweet.author_id);
        
        // Save mention to DB
        const [insertedMention] = await db
          .insert(mentions)
          .values({
            accountId: account.id,
            externalId: tweet.id,
            authorHandle: author?.username || "unknown",
            authorName: author?.name || "Unknown",
            authorAvatar: author?.profile_image_url,
            contentText: tweet.text,
            repliedToTweetId: tweet.referenced_tweets?.[0]?.id,
          })
          .onConflictDoNothing()
          .returning();

        if (insertedMention) {
          console.log(`[Mentions Worker] New mention from @${author?.username}: ${tweet.text.substring(0, 50)}...`);

          // 2. Check if we should auto-reply
          const [rules] = await db
            .select()
            .from(automationRules)
            .where(eq(automationRules.accountId, account.id))
            .limit(1);

          if (rules?.autoReply) {
            try {
              console.log(`[Mentions Worker] Generating auto-reply for @${author?.username}...`);
              const replyText = await generateReplyToMention(
                account.id,
                tweet.id,
                tweet.text,
                author?.username || "unknown"
              );

              // Post the reply to X
              const xResult = await replyToTweet(account, replyText, tweet.id);

              // Save the reply as a generated post record
              const [newPost] = await db
                .insert(generatedPosts)
                .values({
                  accountId: account.id,
                  generatedText: replyText,
                  status: "published",
                  publishedAt: new Date(),
                  postType: "reply",
                  targetTweetId: tweet.id,
                  externalPlatformId: xResult.id,
                })
                .returning();

              // Link the reply to the mention
              await db
                .update(mentions)
                .set({ aiReplyId: newPost.id })
                .where(eq(mentions.id, insertedMention.id));

              console.log(`[Mentions Worker] Auto-reply posted successfully!`);
            } catch (replyErr) {
              console.error("[Mentions Worker] Failed to auto-reply:", replyErr);
            }
          }
        }
      }
    } catch (err) {
      console.error(`[Mentions Worker] Error for account @${account.screenName}:`, err);
    }
  }

  console.log("[Mentions Worker] Cycle finished.");
}
