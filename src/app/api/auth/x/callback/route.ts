import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, fetchXUserProfile } from "@/lib/x-api/oauth-flow";
import { db } from "@/db";
import { xAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/accounts?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code || !returnedState) {
    return NextResponse.redirect(
      new URL("/dashboard/accounts?error=missing_params", request.url)
    );
  }

  // Verify state
  const cookieStore = await cookies();
  const storedState = cookieStore.get("x_oauth_state")?.value;
  const codeVerifier = cookieStore.get("x_code_verifier")?.value;

  if (!storedState || storedState !== returnedState || !codeVerifier) {
    return NextResponse.redirect(
      new URL("/dashboard/accounts?error=state_mismatch", request.url)
    );
  }

  try {
    // Exchange code for tokens
    const { accessToken, refreshToken, expiresAt } = await exchangeCodeForTokens(
      code,
      codeVerifier
    );

    // Fetch X user profile
    const profile = await fetchXUserProfile(accessToken);

    // Upsert x_account
    await db
      .insert(xAccounts)
      .values({
        ownerId: session.user.id,
        xUserId: profile.id,
        screenName: profile.username,
        avatarUrl: profile.profile_image_url,
        accessToken,
        refreshToken,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: xAccounts.xUserId,
        set: {
          accessToken,
          refreshToken,
          expiresAt,
          avatarUrl: profile.profile_image_url,
          updatedAt: new Date(),
        },
      });

    // Clear OAuth cookies
    cookieStore.delete("x_code_verifier");
    cookieStore.delete("x_oauth_state");

    return NextResponse.redirect(
      new URL("/dashboard/accounts?success=connected", request.url)
    );
  } catch (err) {
    console.error("X OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/dashboard/accounts?error=token_exchange_failed", request.url)
    );
  }
}
