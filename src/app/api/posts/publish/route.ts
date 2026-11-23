import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { generatedPosts, xAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { publishPost } from "@/lib/post-service";
import { z } from "zod";

const schema = z.object({ postId: z.string().uuid() });

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Enforce post ownership (prevent IDOR across users)
  if (session.user.role !== "admin") {
    const [row] = await db
      .select({ ownerId: xAccounts.ownerId })
      .from(generatedPosts)
      .innerJoin(xAccounts, eq(generatedPosts.accountId, xAccounts.id))
      .where(eq(generatedPosts.id, parsed.data.postId))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (row.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const result = await publishPost(parsed.data.postId);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
