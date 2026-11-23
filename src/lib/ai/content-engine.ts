import { generateText } from "ai";
import { getAIModel } from "./provider";
import { db } from "@/db";
import {
  externalTweetLibrary,
  generatedPosts,
  xAccounts,
  niches,
  automationRules,
} from "@/db/schema";
import { eq, and, isNull, isNotNull, desc, sql } from "drizzle-orm";
import { getUserTimeline } from "../x-api/search-client";
import { runSearchWorker } from "../workers/search-worker";

interface GenerationContext {
  tweetText: string;
  nicheName: string;
  nicheDescription: string | null;
  tone: string;
  authorHandle: string;
  styleContext: string | null;
  randomStyleHint: string;
  postType: "tweet" | "reply" | "quote";
}

function buildPrompt(ctx: GenerationContext): string {
  const typeInstructions = {
    tweet: "Create a standalone viral tweet inspired by the concept.",
    reply: "Create a smart, engaging reply to the source tweet. Be helpful or witty.",
    quote: "Create a quote-tweet comment. Add your own unique perspective to the source tweet."
  };

  return `You are a world-class Twitter growth expert and visual prompt engineer. Your task is to turn a concept into a viral ${ctx.postType} and a matching image generation prompt.

ACTION: ${typeInstructions[ctx.postType]}
STYLE PROFILE (FOR PERSONALIZATION):
${ctx.styleContext || "Friendly, professional, and minimalist."}

STYLE FOR THIS POST: ${ctx.randomStyleHint}

SOURCE CONCEPT:
"${ctx.tweetText}"

NICHE: ${ctx.nicheName}
TONE: ${ctx.tone}

STRUCTURE TO FOLLOW:
1. THE HOOK: Bold statement.
2. THE VALUE: Clear insight.
3. THE ASK: Compelling question/CTA.

STRICT CONSTRAINTS (CRITICAL):
- NO legal advice, NO politics, NO illegal topics.
- MATCH THE USER'S STYLE from the style profile.
- MAX 240 characters for the tweet.

RESPONSE FORMAT (JSON):
{
  "tweet": "The final tweet text",
  "imagePrompt": "A highly detailed, professional image generation prompt for fal.ai that matches the tweet's vibe (photorealistic, 8k, cinematic lighting, etc.)"
}`;
}

/**
 * Full AI content pipeline:
 * Fetch raw tweet → Get niche/tone → Generate with AI → Save to generated_posts
 */
export async function generatePostFromTweet(
  accountId: string,
  tweetId: string,
  forcedType?: "tweet" | "reply" | "quote"
): Promise<string> {
  // 1. Fetch source tweet
  const [sourceTweet] = await db
    .select()
    .from(externalTweetLibrary)
    .where(eq(externalTweetLibrary.tweetId, tweetId))
    .limit(1);

  if (!sourceTweet) throw new Error(`Tweet ${tweetId} not found in library`);

  // 2. Fetch account & rules
  const [account] = await db
    .select({
      id: xAccounts.id,
      screenName: xAccounts.screenName,
      styleContext: xAccounts.styleContext,
      nicheId: xAccounts.nicheId,
      nicheName: niches.name,
      nicheDescription: niches.description,
    })
    .from(xAccounts)
    .leftJoin(niches, eq(xAccounts.nicheId, niches.id))
    .where(eq(xAccounts.id, accountId))
    .limit(1);

  if (!account) throw new Error("Account not found");

  // 2b. Handle Style Context (Analyze once if missing)
  let styleContext = account.styleContext;
  if (!styleContext && account.screenName) {
    try {
      console.log(`[Content Engine] Analyzing style for @${account.screenName} for the first time...`);
      const timeline = await getUserTimeline(account.screenName);
      const lastPosts = timeline.tweets.slice(0, 10).map(t => t.content_text).join("\n---\n");
      
      // Simple analysis prompt
      const analysisModel = getAIModel();
      const analysisResult = await generateText({
        model: analysisModel,
        prompt: `Analyze the writing style, tone, and typical tweet structure of the following posts. Summarize it in 2-3 sentences for a style profile: \n\n${lastPosts}`,
      });
      
      styleContext = analysisResult.text.trim();
      
      // Save to DB
      await db
        .update(xAccounts)
        .set({ styleContext })
        .where(eq(xAccounts.id, accountId));
      
      console.log(`[Content Engine] Style profile saved for @${account.screenName}`);
    } catch (err) {
      console.error("[Content Engine] Failed to analyze style", err);
    }
  }

  const [rules] = await db
    .select()
    .from(automationRules)
    .where(eq(automationRules.accountId, accountId))
    .limit(1);

  const ctx: GenerationContext = {
    tweetText: sourceTweet.contentText ?? "",
    nicheName: account.nicheName ?? "General",
    nicheDescription: account.nicheDescription ?? null,
    tone: rules?.aiTone ?? "professional and minimalist",
    authorHandle: sourceTweet.authorHandle ?? "unknown",
    styleContext: styleContext,
    randomStyleHint: ["Informative & Insightful", "Fun & Engaging", "Casual & Human"][Math.floor(Math.random() * 3)],
    postType: forcedType ?? "tweet",
  };

  // 3. Generate with AI
  const model = getAIModel();
  const { text } = await generateText({
    model,
    prompt: buildPrompt(ctx),
    maxOutputTokens: 600,
    temperature: 0.8,
  });

  let aiData = { tweet: text, imagePrompt: "" };
  try {
    // Try to parse as JSON if possible, fallback to raw text if AI didn't follow JSON format
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      aiData = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("[Content Engine] Failed to parse AI JSON response, using fallback", e);
  }

  // 4. Save to DB
  let mediaUrl = null;
  let mediaType = null;

  if (sourceTweet.mediaJson && (sourceTweet.mediaJson as any).media) {
    const mediaArray = (sourceTweet.mediaJson as any).media;
    if (mediaArray.length > 0) {
      mediaUrl = mediaArray[0].media_url_https || mediaArray[0].media_url;
      mediaType = mediaArray[0].type; // 'photo', 'video', etc.
    }
  }

  const [newPost] = await db
    .insert(generatedPosts)
    .values({
      accountId,
      sourceTweetId: tweetId,
      generatedText: aiData.tweet,
      imagePrompt: ctx.postType === "tweet" ? aiData.imagePrompt : null, // Only generate images for original tweets
      targetTweetId: ctx.postType !== "tweet" ? tweetId : null,
      mediaUrl,
      mediaType: mediaType === "photo" ? "image" : mediaType,
      status: "pending_approval",
      postType: ctx.postType,
    })
    .returning();

  return aiData.tweet;
}

/**
 * Batch generate posts for all active accounts.
 * Picks up to 5 unprocessed tweets per account from the library.
 */
export async function batchGeneratePosts(targetAccountId?: string, bypassHours = false): Promise<{
  generated: number;
  errors: string[];
}> {
  const query = db
    .select({ 
      id: xAccounts.id,
      screenName: xAccounts.screenName
    })
    .from(xAccounts);

  const accounts = await (targetAccountId 
    ? query.where(and(eq(xAccounts.automationEnabled, true), eq(xAccounts.id, targetAccountId)))
    : query.where(eq(xAccounts.automationEnabled, true)));

  let generated = 0;
  const errors: string[] = [];

  const currentHour = new Date().getHours();

  for (const account of accounts) {
    try {
      // 1b. Check automation rules
      const [rules] = await db
        .select()
        .from(automationRules)
        .where(eq(automationRules.accountId, account.id))
        .limit(1);

      if (!rules) continue;

      // Check hours (unless bypassed by manual run)
      if (!bypassHours && rules.preferredHours && rules.preferredHours.length > 0) {
        if (!rules.preferredHours.includes(currentHour)) {
          console.log(`[Batch Gen] Skipping account ${account.screenName}: Not in preferred hours.`);
          continue;
        }
      }

      // Check daily limit (simple count for today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(generatedPosts)
        .where(
          and(
            eq(generatedPosts.accountId, account.id),
            sql`${generatedPosts.createdAt} >= ${today}`
          )
        );
      
      const countToday = Number(countResult?.count || 0);
      if (countToday >= (rules.dailyPostLimit || 3)) {
        console.log(`[Batch Gen] Skipping account ${account.screenName}: Daily limit reached (${countToday}/${rules.dailyPostLimit}).`);
        continue;
      }

      // 1d. Decide on post type strategy
      let typeStrategy: ("tweet" | "reply" | "quote")[] = ["tweet"];
      if (rules.autoReply) typeStrategy.push("reply");
      if (rules.smartRetweet) typeStrategy.push("quote");
      
      const selectedType = typeStrategy[Math.floor(Math.random() * typeStrategy.length)];

      // Find tweets not yet used as source for this account
    const usedTweetIds = await db
      .select({ sourceTweetId: generatedPosts.sourceTweetId })
      .from(generatedPosts)
      .where(
        and(
          eq(generatedPosts.accountId, account.id),
          isNotNull(generatedPosts.sourceTweetId)
        )
      );

    const usedIds = usedTweetIds
      .map((r) => r.sourceTweetId)
      .filter(Boolean) as string[];

    const candidates = await db
      .select({ tweetId: externalTweetLibrary.tweetId })
      .from(externalTweetLibrary)
      .orderBy(sql`RANDOM()`)
      .limit(20);

    const unused = candidates.filter((c) => !usedIds.includes(c.tweetId));

      for (const candidate of unused.slice(0, 1)) {
        try {
          await generatePostFromTweet(account.id, candidate.tweetId, selectedType);
          generated++;
        } catch (err) {
          errors.push(`Account ${account.id}, Tweet ${candidate.tweetId}: ${String(err)}`);
        }
      }
    } catch (err) {
      errors.push(`Account ${account.id}: ${String(err)}`);
    }
  }

  return { generated, errors };
}

/**
 * Generate a reply to a specific mention (Direct engagement)
 */
export async function generateReplyToMention(
  accountId: string,
  mentionId: string,
  mentionText: string,
  authorHandle: string
): Promise<string> {
  const [account] = await db
    .select({ 
      styleContext: xAccounts.styleContext,
      screenName: xAccounts.screenName 
    })
    .from(xAccounts)
    .where(eq(xAccounts.id, accountId))
    .limit(1);

  if (!account) throw new Error("Account not found");

  const model = getAIModel();
  const { text } = await generateText({
    model,
    prompt: `You are @${account.screenName}. Someone just replied to you or mentioned you on Twitter.
    
USER (@${authorHandle}): "${mentionText}"

YOUR STYLE PROFILE:
${account.styleContext || "Friendly and professional."}

TASK: Write a short, engaging, and human-like reply to this user. 
- Be helpful, witty, or appreciative depending on their tone.
- NO legal advice, NO politics.
- MAX 240 characters.
- Match your style profile.
- Output ONLY the reply text.`,
    maxOutputTokens: 200,
  });

  return text.trim();
}

/**
 * Manually generate a set number of posts for a specific account.
 */
export async function manualGeneratePosts(
  accountId: string,
  countToGenerate = 5
): Promise<{ generated: number; errors: string[] }> {
  let generated = 0;
  const errors: string[] = [];

  // 1. Get the niche for this account
  const [account] = await db
    .select({ 
      nicheId: xAccounts.nicheId,
      screenName: xAccounts.screenName 
    })
    .from(xAccounts)
    .where(eq(xAccounts.id, accountId))
    .limit(1);

  if (!account) throw new Error("Account not found");

  // 1b. Fetch user's style reference (last 10 posts)
  let styleReferencePosts: string[] = [];
  if (account.screenName) {
    try {
      console.log(`[Content Engine] Fetching timeline for style matching: @${account.screenName}`);
      const timeline = await getUserTimeline(account.screenName);
      styleReferencePosts = timeline.tweets.slice(0, 10).map(t => t.content_text);
    } catch (err) {
      console.error("[Content Engine] Failed to fetch timeline for style matching", err);
    }
  }

  // 2. Find tweets not yet used as source for this account
  const usedTweetIds = await db
    .select({ sourceTweetId: generatedPosts.sourceTweetId })
    .from(generatedPosts)
    .where(
      and(
        eq(generatedPosts.accountId, accountId),
        isNotNull(generatedPosts.sourceTweetId)
      )
    );

  const usedIds = usedTweetIds
    .map((r) => r.sourceTweetId)
    .filter(Boolean) as string[];

  // 3. Get candidates from library (could filter by niche here if library had niche tags)
  // For now, we take general candidates that haven't been used.
  const candidates = await db
    .select({ tweetId: externalTweetLibrary.tweetId })
    .from(externalTweetLibrary)
    .limit(100); // Fetch more to filter

  const unused = candidates.filter((c) => !usedIds.includes(c.tweetId));
  console.log(`[Content Engine] Library has ${candidates.length} total candidates. Unused for this account: ${unused.length}`);

  // 4. Generate
  for (const candidate of unused.slice(0, countToGenerate)) {
    try {
      await generatePostFromTweet(accountId, candidate.tweetId);
      generated++;
    } catch (err) {
      errors.push(`Tweet ${candidate.tweetId}: ${String(err)}`);
    }
  }

  return { generated, errors };
}

