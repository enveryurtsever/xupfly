import { auth } from "@/auth";
import { db } from "@/db";
import { mentions, xAccounts, generatedPosts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NotificationsClient } from "./NotificationsClient";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const results = await db
    .select({
      id: mentions.id,
      authorHandle: mentions.authorHandle,
      authorName: mentions.authorName,
      authorAvatar: mentions.authorAvatar,
      contentText: mentions.contentText,
      repliedToTweetId: mentions.repliedToTweetId,
      isRead: mentions.isRead,
      createdAt: mentions.createdAt,
      accountName: xAccounts.screenName,
      aiReplyText: generatedPosts.generatedText,
      aiReplyStatus: generatedPosts.status,
    })
    .from(mentions)
    .leftJoin(xAccounts, eq(mentions.accountId, xAccounts.id))
    .leftJoin(generatedPosts, eq(mentions.aiReplyId, generatedPosts.id))
    .where(eq(xAccounts.ownerId, session.user.id))
    .orderBy(desc(mentions.createdAt));

  return <NotificationsClient initialMentions={results} />;
}
