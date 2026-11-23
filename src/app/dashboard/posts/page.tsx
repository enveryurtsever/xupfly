import { auth } from "@/auth";
import { db } from "@/db";
import { generatedPosts, xAccounts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { PostsClient } from "./PostsClient";

export const metadata = { title: "Post Queue" };

export default async function PostsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const posts = await db
    .select({
      id: generatedPosts.id,
      text: generatedPosts.generatedText,
      status: generatedPosts.status,
      scheduledAt: generatedPosts.scheduledAt,
      publishedAt: generatedPosts.publishedAt,
      accountName: xAccounts.screenName,
      mediaUrl: generatedPosts.mediaUrl,
      mediaType: generatedPosts.mediaType,
      imagePrompt: generatedPosts.imagePrompt,
    })
    .from(generatedPosts)
    .leftJoin(xAccounts, eq(generatedPosts.accountId, xAccounts.id))
    .where(eq(xAccounts.ownerId, session.user.id))
    .orderBy(desc(generatedPosts.scheduledAt || generatedPosts.id));

  return <PostsClient initialPosts={posts} />;
}

