import { db } from "@/db";
import { generatedPosts, xAccounts, users } from "@/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { postTweet, replyToTweet, quoteTweet } from "@/lib/x-api/official-client";
import { checkAndDeduct } from "@/lib/credits/credit-service";
import { generateFalImage } from "@/lib/ai/fal-client";
import type { ActionType } from "@/lib/credits/credit-service";

/** Map post_type enum → credit action type */
const TYPE_MAP: Record<string, ActionType> = {
  tweet: "tweet",
  reply: "reply",
  retweet: "retweet",
  quote: "quote",
  thread: "thread",
};

/**
 * Publish a single generated post.
 * Deducts credits atomically before any write to X.
 */
export async function publishPost(postId: string): Promise<{
  success: boolean;
  error?: string;
  tweetId?: string;
}> {
  // 1. Load post + account
  const [post] = await db
    .select()
    .from(generatedPosts)
    .where(eq(generatedPosts.id, postId))
    .limit(1);

  if (!post) return { success: false, error: "Post not found" };
  if (post.status === "published") return { success: false, error: "Already published" };

  const [account] = await db
    .select()
    .from(xAccounts)
    .where(eq(xAccounts.id, post.accountId!))
    .limit(1);

  if (!account) return { success: false, error: "X account not found" };

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, account.ownerId!))
    .limit(1);

  if (!user) return { success: false, error: "User not found" };

  // 2. Check + deduct credits BEFORE posting
  const action = TYPE_MAP[post.postType ?? "tweet"] ?? "tweet";
  const creditResult = await checkAndDeduct(
    user.id,
    account.id,
    action,
    `Published ${action} via XUPFLY`
  );

  if (!creditResult.success) {
    await db
      .update(generatedPosts)
      .set({ status: "failed", errorLog: creditResult.reason })
      .where(eq(generatedPosts.id, postId));
    return { success: false, error: creditResult.reason };
  }

  // 3. Optional: Generate AI image if prompt exists and no media yet
  let finalMediaUrl = post.mediaUrl;
  if (post.imagePrompt && !finalMediaUrl) {
    try {
      const falImageUrl = await generateFalImage(post.imagePrompt);
      if (falImageUrl) {
        finalMediaUrl = falImageUrl;
        // Update post with generated image URL
        await db
          .update(generatedPosts)
          .set({ mediaUrl: falImageUrl, mediaType: "image" })
          .where(eq(generatedPosts.id, postId));
      }
    } catch (err) {
      console.error("[Post Service] Fal.ai generation failed, falling back to text only", err);
    }
  }

  // 4. Post to X
  try {
    let xResult: { id: string; text: string };

    if (post.postType === "reply" && post.targetTweetId) {
      xResult = await replyToTweet(account, post.generatedText, post.targetTweetId, finalMediaUrl);
    } else if (post.postType === "quote" && post.targetTweetId) {
      xResult = await quoteTweet(account, post.generatedText, post.targetTweetId, finalMediaUrl);
    } else {
      xResult = await postTweet(account, post.generatedText, finalMediaUrl);
    }

    // 4. Mark as published
    await db
      .update(generatedPosts)
      .set({
        status: "published",
        publishedAt: new Date(),
        externalPlatformId: xResult.id,
        errorLog: null,
      })
      .where(eq(generatedPosts.id, postId));

    return { success: true, tweetId: xResult.id };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);

    // Refund credits on API failure
    const { addCredits } = await import("@/lib/credits/credit-service");
    await addCredits(user.id, await import("@/lib/settings-service").then(m => m.getSetting(`credit_cost_${action}`)), "REFUND", `Refund for failed ${action}`, account.id);

    await db
      .update(generatedPosts)
      .set({ status: "failed", errorLog: errMsg })
      .where(eq(generatedPosts.id, postId));

    return { success: false, error: errMsg };
  }
}

/**
 * Publish all posts that are scheduled and due.
 * Called by the cron job route.
 */
export async function publishDuePosts(): Promise<{
  published: number;
  failed: number;
  errors: string[];
}> {
  const duePosts = await db
    .select({ id: generatedPosts.id })
    .from(generatedPosts)
    .where(
      and(
        eq(generatedPosts.status, "scheduled"),
        lte(generatedPosts.scheduledAt, new Date())
      )
    );

  let published = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const post of duePosts) {
    const result = await publishPost(post.id);
    if (result.success) {
      published++;
    } else {
      failed++;
      errors.push(`Post ${post.id}: ${result.error}`);
    }
  }

  return { published, failed, errors };
}
