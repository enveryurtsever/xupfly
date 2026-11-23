import { db } from "@/db";
import { generatedPosts, xAccounts } from "@/db/schema";
import { eq, and, isNull, lt, or } from "drizzle-orm";
import { postTweet, replyToTweet, quoteTweet } from "@/lib/x-api/official-client";
import { generateFalImage } from "@/lib/ai/fal-client";

/**
 * Worker to find approved posts and publish them to X.
 * Handles AI image generation right before publishing if needed.
 */
export async function runPublishWorker(targetAccountId?: string) {
  console.log("[Publish Worker] Checking for posts to publish...");

  // 1. Get posts that are approved but not yet published
  // We process only ONE post per cycle to avoid spam, as requested.
  const query = db
    .select()
    .from(generatedPosts);

  const pendingPosts = await (targetAccountId
    ? query.where(
        and(
          eq(generatedPosts.status, "approved"),
          isNull(generatedPosts.publishedAt),
          eq(generatedPosts.accountId, targetAccountId)
        )
      )
    : query.where(
        and(
          eq(generatedPosts.status, "approved"),
          isNull(generatedPosts.publishedAt)
        )
      )
    ).limit(1);

  if (pendingPosts.length === 0) {
    console.log("[Publish Worker] No pending approved posts to publish.");
    return;
  }

  for (const post of pendingPosts) {
    try {
      // Get the account
      const [account] = await db
        .select()
        .from(xAccounts)
        .where(eq(xAccounts.id, post.accountId!))
        .limit(1);

      if (!account) {
        console.error(`[Publish Worker] Account not found for post ${post.id}`);
        continue;
      }

      console.log(`[Publish Worker] Publishing post ${post.id} for @${account.screenName}...`);

      let currentMediaUrl = post.mediaUrl;

      // 2. If it has an image prompt but no media URL yet, generate it now
      if (post.imagePrompt && !currentMediaUrl) {
        console.log(`[Publish Worker] Generating AI image for post ${post.id}...`);
        const generatedUrl = await generateFalImage(post.imagePrompt);
        if (generatedUrl) {
          currentMediaUrl = generatedUrl;
          // Save back to DB so we don't regenerate if something fails later
          await db
            .update(generatedPosts)
            .set({ mediaUrl: generatedUrl, mediaType: "image" })
            .where(eq(generatedPosts.id, post.id));
        }
      }

      // 3. Publish to X based on postType
      let result;
      if (post.postType === "reply" && post.targetTweetId) {
        result = await replyToTweet(account, post.generatedText, post.targetTweetId, currentMediaUrl);
      } else if (post.postType === "quote" && post.targetTweetId) {
        result = await quoteTweet(account, post.generatedText, post.targetTweetId, currentMediaUrl);
      } else {
        result = await postTweet(account, post.generatedText, currentMediaUrl);
      }

      // 4. Update status to published
      await db
        .update(generatedPosts)
        .set({
          status: "published",
          publishedAt: new Date(),
          externalPlatformId: result.id
        })
        .where(eq(generatedPosts.id, post.id));

      console.log(`[Publish Worker] Post ${post.id} published successfully! ID: ${result.id}`);

    } catch (err) {
      console.error(`[Publish Worker] Failed to publish post ${post.id}:`, err);
      // Optional: Update status to 'failed' if needed
    }
  }
}
