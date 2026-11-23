import { NextRequest, NextResponse } from "next/server";
import { batchGeneratePosts } from "@/lib/ai/content-engine";
import { verifyCronRequest } from "@/lib/auth/cron";

export async function GET(req: NextRequest) {
  const denied = verifyCronRequest(req);
  if (denied) return denied;

  try {
    const result = await batchGeneratePosts();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
