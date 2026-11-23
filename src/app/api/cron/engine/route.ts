import { NextRequest, NextResponse } from "next/server";
import { runGlobalEngine } from "@/lib/workers/global-engine";
import { verifyCronRequest } from "@/lib/auth/cron";

export async function GET(req: NextRequest) {
  const denied = verifyCronRequest(req);
  if (denied) return denied;

  try {
    console.log("[Cron API] Triggering Global Engine Cycle...");
    await runGlobalEngine();

    return NextResponse.json({
      success: true,
      message: "Global engine cycle executed successfully.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Cron API] Failed:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
