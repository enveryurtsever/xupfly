import axios from "axios";

const BASE_URL = "https://twitter-api45.p.rapidapi.com";

const headers = {
  "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
  "x-rapidapi-host": process.env.RAPIDAPI_HOST ?? "twitter-api45.p.rapidapi.com",
  "Content-Type": "application/json",
};

export interface SearchedTweet {
  tweet_id: string;
  author_id: string;
  author_handle: string;
  content_text: string;
  lang: string;
  media_json: Record<string, unknown> | null;
  metrics_json: {
    favorites: number;
    retweets: number;
    views: number;
    replies: number;
  };
  raw_api_response: Record<string, unknown>;
}

interface RawTweet {
  tweet_id?: string;
  id?: string;
  author?: { id?: string; screen_name?: string };
  full_text?: string;
  text?: string;
  lang?: string;
  extended_entities?: Record<string, unknown>;
  media?: Record<string, unknown>;
  favorite_count?: number;
  retweet_count?: number;
  views?: number | Record<string, unknown>;
  reply_count?: number;
  [key: string]: unknown;
}

/** Normalize raw API response to our internal shape */
function normalizeTweet(raw: RawTweet): SearchedTweet | null {
  const tweetId = raw.tweet_id ?? raw.id;
  if (!tweetId) return null;

  return {
    tweet_id: String(tweetId),
    author_id: String(raw.author?.id ?? ""),
    author_handle: raw.author?.screen_name ?? "",
    content_text: raw.full_text ?? raw.text ?? "",
    lang: raw.lang ?? "en",
    media_json: (raw.extended_entities ?? raw.media ?? null) as Record<string, unknown> | null,
    metrics_json: {
      favorites: Number(raw.favorite_count ?? 0),
      retweets: Number(raw.retweet_count ?? 0),
      views: Number((raw.views as Record<string,unknown>)?.count ?? raw.views ?? 0),
      replies: Number(raw.reply_count ?? 0),
    },
    raw_api_response: raw as Record<string, unknown>,
  };
}

/** Search tweets by query string */
export async function searchTweets(
  query: string,
  cursor?: string
): Promise<{ tweets: SearchedTweet[]; nextCursor?: string }> {
  const params: Record<string, string> = { query };
  if (cursor) params.cursor = cursor;

  const response = await axios.get(`${BASE_URL}/search.php`, {
    headers,
    params,
  });

  const data = response.data;
  const rawTweets: RawTweet[] = data?.timeline ?? data?.tweets ?? [];
  const nextCursor: string | undefined = data?.next_cursor ?? data?.cursor ?? undefined;

  const tweets = rawTweets
    .map(normalizeTweet)
    .filter((t): t is SearchedTweet => t !== null);

  return { tweets, nextCursor };
}

/** Fetch a user's timeline by screen name */
export async function getUserTimeline(
  screenName: string,
  cursor?: string
): Promise<{ tweets: SearchedTweet[]; nextCursor?: string }> {
  const params: Record<string, string> = { screenname: screenName };
  if (cursor) params.cursor = cursor;

  const response = await axios.get(`${BASE_URL}/timeline.php`, {
    headers,
    params,
  });

  const data = response.data;
  const rawTweets: RawTweet[] = data?.timeline ?? [];
  const nextCursor: string | undefined = data?.next_cursor ?? undefined;

  const tweets = rawTweets
    .map(normalizeTweet)
    .filter((t): t is SearchedTweet => t !== null);

  return { tweets, nextCursor };
}

/** Get trending topics */
export async function getTrending(woeid = "1"): Promise<string[]> {
  const response = await axios.get(`${BASE_URL}/trending.php`, {
    headers,
    params: { woeid },
  });
  return response.data?.trends?.map((t: { name: string }) => t.name) ?? [];
}
