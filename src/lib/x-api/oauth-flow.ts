import crypto from "crypto";
import axios from "axios";

const AUTH_BASE = "https://twitter.com/i/oauth2/authorize";
const TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
const USER_URL = "https://api.twitter.com/2/users/me";

const SCOPES = ["tweet.read", "tweet.write", "users.read", "like.read", "like.write", "offline.access"];

// ─── PKCE Helpers ──────────────────────────────────────────────────────────────
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}

// ─── OAuth Flow ────────────────────────────────────────────────────────────────

/** Step 1: Generate the authorization URL. Store verifier + state in session/cookie. */
export function generateAuthUrl(): {
  url: string;
  codeVerifier: string;
  state: string;
} {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.X_CLIENT_ID!,
    redirect_uri: process.env.X_CALLBACK_URL!,
    scope: SCOPES.join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return {
    url: `${AUTH_BASE}?${params.toString()}`,
    codeVerifier,
    state,
  };
}

/** Step 2: Exchange authorization code for tokens */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}> {
  const clientId = encodeURIComponent(process.env.X_CLIENT_ID!);
  const credentials = Buffer.from(
    `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
  ).toString("base64");
  
  try {
    const response = await axios.post(
      TOKEN_URL,
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.X_CALLBACK_URL!,
        code_verifier: codeVerifier,
      }),
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    return { accessToken: access_token, refreshToken: refresh_token, expiresAt };
  } catch (error: any) {
    console.error("X Token Exchange Error:", error.response?.data || error.message);
    throw error;
  }
}

/** Step 3: Fetch X user profile with the access token */
export async function fetchXUserProfile(accessToken: string): Promise<{
  id: string;
  username: string;
  name: string;
  profile_image_url: string;
}> {
  const response = await axios.get(
    `${USER_URL}?user.fields=profile_image_url,name,username`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return response.data.data;
}
