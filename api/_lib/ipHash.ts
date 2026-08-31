import { createHash } from "node:crypto";
import type { VercelRequest } from "@vercel/node";

/** Real client IP from Vercel's forwarded header — never trust anything the client claims about itself. */
export function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const ip = value?.split(",")[0]?.trim();
  return ip || "unknown";
}

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT;
  if (!salt) throw new Error("IP_HASH_SALT must be set");
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
