import { NextRequest, NextResponse } from "next/server";
import { runMentionsWorker } from "@/lib/workers/mentions-worker";
import { verifyCronRequest } from "@/lib/auth/cron";

export async function GET(req: NextRequest) {
  const denied = verifyCronRequest(req);
  if (denied) return denied;

  try {
    await runMentionsWorker();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
