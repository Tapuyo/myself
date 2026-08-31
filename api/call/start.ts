import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin";
import { getClientIp, hashIp } from "../_lib/ipHash";
import { profile } from "../_lib/profile";
import { countTodaysCalls } from "./status";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    const ipHash = hashIp(getClientIp(req));
    const maxCalls = profile.callWidget.maxCallsPerDay;

    // Best-effort check-then-insert (not a hard atomic guarantee under a
    // race of two simultaneous connects from the same IP) — acceptable for
    // a soft daily cap on a portfolio site, not a security boundary.
    const used = await countTodaysCalls(ipHash);
    if (used >= maxCalls) {
      res.status(429).json({
        allowed: false,
        remainingCalls: 0,
        message: "You've reached today's limit of 2 calls. Please come back tomorrow.",
      });
      return;
    }

    const { data, error } = await getSupabaseAdmin()
      .from("call_sessions")
      .insert({ ip_hash: ipHash })
      .select("id")
      .single();

    if (error) throw error;

    res.status(200).json({
      allowed: true,
      sessionId: data.id,
      remainingCalls: Math.max(0, maxCalls - (used + 1)),
    });
  } catch (err) {
    console.error("[call/start]", err);
    res.status(500).json({ allowed: false, remainingCalls: 0, message: "Could not start the call." });
  }
}
