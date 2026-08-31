import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin";
import { getClientIp, hashIp } from "../_lib/ipHash";
import { profile } from "../_lib/profile";

const DAY_TZ = "Asia/Manila";

/** Start-of-today and start-of-tomorrow in Asia/Manila, as UTC instants. */
function todayBoundsManila(): { start: string; end: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DAY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const start = new Date(`${parts}T00:00:00+08:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function countTodaysCalls(ipHash: string): Promise<number> {
  const { start, end } = todayBoundsManila();
  const { count, error } = await getSupabaseAdmin()
    .from("call_sessions")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("started_at", start)
    .lt("started_at", end);

  if (error) throw error;
  return count ?? 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    const ipHash = hashIp(getClientIp(req));
    const used = await countTodaysCalls(ipHash);
    const remainingCalls = Math.max(0, profile.callWidget.maxCallsPerDay - used);
    res.status(200).json({ remainingCalls, capSeconds: profile.callWidget.capSeconds });
  } catch (err) {
    console.error("[call/status]", err);
    res.status(500).json({ message: "Could not check call availability." });
  }
}
