import { NextRequest, NextResponse } from "next/server";
import { generateAuthUrl } from "@/lib/x-api/oauth-flow";
import { auth } from "@/auth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { url, codeVerifier, state } = generateAuthUrl();

  // Store verifier + state in secure HTTP-only cookies (30 min TTL)
  const cookieStore = await cookies();
  cookieStore.set("x_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 30,
  });
  cookieStore.set("x_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 30,
  });

  return NextResponse.redirect(url);
}
