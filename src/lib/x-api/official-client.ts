import { TwitterApi } from "twitter-api-v2";
import { db } from "@/db";
import { xAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import axios from "axios";

/**
 * Get an authenticated Twitter client for a specific account.
 * Automatically handles token refresh.
 */
export async function getTwitterClient(account: {
  id: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date | null;
}) {
  const isExpired = account.expiresAt && account.expiresAt < new Date();
  
  if (isExpired) {
    const credentials = Buffer.from(
      `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
    ).toString("base64");

    const refreshClient = new TwitterApi({
      clientId: process.env.X_CLIENT_ID!,
      clientSecret: process.env.X_CLIENT_SECRET!,
    });

    const { accessToken, refreshToken, expiresIn, client } = await refreshClient.refreshOAuth2Token(account.refreshToken);
    
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Update DB
    await db
      .update(xAccounts)
      .set({
        accessToken,
        refreshToken: refreshToken ?? account.refreshToken,
        expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(xAccounts.id, account.id));

    return client;
  }

  return new TwitterApi(account.accessToken);
}

/** Post a new tweet (with optional media) */
export async function postTweet(
  account: any,
  text: string,
  mediaUrl?: string | null
): Promise<{ id: string; text: string }> {
  const client = await getTwitterClient(account);
  
  let mediaIds: string[] = [];
  
  if (mediaUrl) {
    try {
      console.log(`[X API] Downloading media for upload: ${mediaUrl.substring(0, 50)}...`);
      const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');
      
      // Upload media via v1.1 endpoint (required for v2 tweets)
      const mediaId = await client.v1.uploadMedia(buffer, { mimeType: 'image/jpeg' });
      mediaIds = [mediaId];
      console.log(`[X API] Media uploaded successfully. ID: ${mediaId}`);
    } catch (err) {
      console.error("[X API] Media upload failed, posting text only:", err);
    }
  }

  const result = await client.v2.tweet({
    text,
    ...(mediaIds.length > 0 ? { media: { media_ids: mediaIds as [string] } } : {})
  });

  return { id: result.data.id, text: result.data.text };
}

/** Reply to an existing tweet */
export async function replyToTweet(
  account: any,
  text: string,
  replyToId: string,
  mediaUrl?: string | null
): Promise<{ id: string; text: string }> {
  const client = await getTwitterClient(account);
  
  let mediaIds: string[] = [];
  if (mediaUrl) {
    try {
      const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
      const mediaId = await client.v1.uploadMedia(Buffer.from(response.data, 'binary'), { mimeType: 'image/jpeg' });
      mediaIds = [mediaId];
    } catch (e) {}
  }

  const result = await client.v2.reply(text, replyToId, {
    ...(mediaIds.length > 0 ? { media: { media_ids: mediaIds as [string] } } : {})
  });

  return { id: result.data.id, text: result.data.text };
}

/** Quote-tweet */
export async function quoteTweet(
  account: any,
  text: string,
  quotedTweetId: string,
  mediaUrl?: string | null
): Promise<{ id: string; text: string }> {
  const client = await getTwitterClient(account);
  
  let mediaIds: string[] = [];
  if (mediaUrl) {
    try {
      const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
      const mediaId = await client.v1.uploadMedia(Buffer.from(response.data, 'binary'), { mimeType: 'image/jpeg' });
      mediaIds = [mediaId];
    } catch (e) {}
  }

  const result = await client.v2.quote(text, quotedTweetId, {
    ...(mediaIds.length > 0 ? { media: { media_ids: mediaIds as [string] } } : {})
  });

  return { id: result.data.id, text: result.data.text };
}

/** Delete a tweet */
export async function deleteTweet(account: any, tweetId: string): Promise<void> {
  const client = await getTwitterClient(account);
  await client.v2.deleteTweet(tweetId);
}

/** Like a tweet */
export async function likeTweet(account: any, tweetId: string): Promise<void> {
  const client = await getTwitterClient(account);
  await client.v2.like(account.xUserId, tweetId);
}

/** Get recent mentions using RapidAPI (twitter-api45) */
export async function getMentions(account: any, sinceId?: string) {
  const url = `https://twitter-api45.p.rapidapi.com/search.php?query=@${account.screenName}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY || '',
      'x-rapidapi-host': 'twitter-api45.p.rapidapi.com',
    }
  });

  if (!response.ok) {
    throw new Error(`RapidAPI search failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Normalize the RapidAPI response to match what the worker expects
  // RapidAPI search returns { timeline: [...] }
  return {
    data: {
      data: data.timeline.map((t: any) => ({
        id: t.tweet_id,
        text: t.text,
        author_id: t.user.user_id,
        created_at: t.created_at,
        referenced_tweets: [{ id: t.replying_to || null }]
      }))
    },
    includes: {
      users: data.timeline.map((t: any) => ({
        id: t.user.user_id,
        username: t.user.screen_name,
        name: t.user.name,
        profile_image_url: t.user.avatar
      }))
    }
  };
}
