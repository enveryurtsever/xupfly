import { db } from "@/db";
import { searchConfigs, externalTweetLibrary } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { searchTweets } from "@/lib/x-api/search-client";

/**
 * Search Worker — fetches tweets from the 3rd-party API based on all active
 * search_configs and upserts them into external_tweet_library.
 */
export async function runSearchWorker(
  nicheId?: string,
  langOverride?: string,
  locationOverride?: string,
  accountId?: string
): Promise<{
  processed: number;
  inserted: number;
  errors: string[];
}> {
  let query = db.select().from(searchConfigs).where(eq(searchConfigs.isActive, true));

  if (nicheId) {
    query = db.select().from(searchConfigs).where(
      and(eq(searchConfigs.isActive, true), eq(searchConfigs.nicheId, nicheId))
    );
  }

  const configs = await query;

  // Fallback: If no configs found for this niche, create a temporary one based on niche name
  if (nicheId && configs.length === 0) {
    const { niches } = await import("@/db/schema");
    const [niche] = await db.select().from(niches).where(eq(niches.id, nicheId)).limit(1);
    if (niche) {
      configs.push({
        id: "temp",
        nicheId: niche.id,
        queryTerm: niche.name,
        searchType: "Top",
        minFaves: 0,
        minRetweets: 0,
        languageFilter: "en",
        exclusiveOperators: null,
        isActive: true,
        lastCursor: null,
        createdAt: new Date(),
      } as any);
    }
  }

  // 1b. Add extra keywords if accountId is provided
  if (accountId) {
    const { automationRules } = await import("@/db/schema");
    const [rules] = await db
      .select({ searchKeywords: automationRules.searchKeywords })
      .from(automationRules)
      .where(eq(automationRules.accountId, accountId))
      .limit(1);

    if (rules?.searchKeywords) {
      const extraTerms = rules.searchKeywords.split(",").map(s => s.trim()).filter(Boolean);
      for (const term of extraTerms) {
        configs.push({
          id: `extra-${term}`,
          nicheId: nicheId || null,
          queryTerm: term,
          searchType: "Top",
          minFaves: 0,
          minRetweets: 0,
          languageFilter: langOverride || "en",
          exclusiveOperators: null,
          isActive: true,
          lastCursor: null,
          createdAt: new Date(),
        } as any);
      }
    }
  }

  let processed = 0;
  let inserted = 0;
  const errors: string[] = [];

  for (const config of configs) {
    try {
      let finalQuery = config.queryTerm;
      const lang = langOverride || config.languageFilter || "en";
      
      if (lang) finalQuery += ` lang:${lang}`;
      if (locationOverride) finalQuery += ` near:"${locationOverride}"`;

      const { tweets, nextCursor } = await searchTweets(
        finalQuery,
        config.lastCursor ?? undefined
      );

      for (const tweet of tweets) {
        // Skip tweets below engagement thresholds
        if (
          tweet.metrics_json.favorites < (config.minFaves ?? 0) ||
          tweet.metrics_json.retweets < (config.minRetweets ?? 0)
        ) {
          continue;
        }

        // Skip if language doesn't match filter
        if (config.languageFilter && tweet.lang !== config.languageFilter) {
          continue;
        }

        // Upsert — ignore if already exists
        await db
          .insert(externalTweetLibrary)
          .values({
            tweetId: tweet.tweet_id,
            authorId: tweet.author_id,
            authorHandle: tweet.author_handle,
            contentText: tweet.content_text,
            lang: tweet.lang,
            mediaJson: tweet.media_json,
            metricsJson: tweet.metrics_json,
            rawApiResponse: tweet.raw_api_response,
          })
          .onConflictDoUpdate({
            target: externalTweetLibrary.tweetId,
            set: {
              metricsJson: tweet.metrics_json,
              lastUpdatedAt: new Date(),
            },
          });

        inserted++;
      }

      // Update cursor for pagination
      if (nextCursor) {
        await db
          .update(searchConfigs)
          .set({ lastCursor: nextCursor })
          .where(eq(searchConfigs.id, config.id));
      }

      processed++;
    } catch (err) {
      errors.push(`Config ${config.id} (${config.queryTerm}): ${String(err)}`);
    }
  }

  return { processed, inserted, errors };
}
