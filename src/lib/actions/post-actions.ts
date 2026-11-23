"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { generatedPosts } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { publishPost } from "@/lib/post-service";

export async function deletePostAction(postId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await db
      .delete(generatedPosts)
      .where(eq(generatedPosts.id, postId));

    revalidatePath("/dashboard/posts");
    return { success: true };
  } catch (error) {
    console.error("Post delete error:", error);
    return { success: false, error: "Failed to delete post." };
  }
}

export async function publishAllAction(postIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await db
      .update(generatedPosts)
      .set({ status: "published", publishedAt: new Date() })
      .where(inArray(generatedPosts.id, postIds));

    revalidatePath("/dashboard/posts");
    return { success: true };
  } catch (error) {
    console.error("Publish all error:", error);
    return { success: false, error: "Failed to publish all posts." };
  }
}

export async function publishPostAction(postId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const result = await publishPost(postId);
    revalidatePath("/dashboard/posts");
    return result;
  } catch (error) {
    console.error("Publish post error:", error);
    return { success: false, error: "Failed to publish post." };
  }
}
