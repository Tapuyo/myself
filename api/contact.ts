import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "./_lib/supabaseAdmin.js";

interface ContactBody {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  company?: string; // honeypot — must stay empty
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const body: ContactBody = req.body ?? {};

  // Bots tend to fill every input, including hidden ones. Pretend success
  // without writing anything so the bot doesn't learn to adapt.
  if (body.company) {
    res.status(200).json({ ok: true });
    return;
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const phone = body.phone?.trim() || null;
  const message = body.message?.trim() ?? "";

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Name is required.";
  if (!email) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  if (!message) errors.message = "Message is required.";

  if (Object.keys(errors).length > 0) {
    res.status(400).json({ ok: false, errors });
    return;
  }

  try {
    const { error } = await getSupabaseAdmin()
      .from("contacts")
      .insert({ name, email, phone, message });

    if (error) throw error;

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[contact]", err);
    res.status(500).json({ ok: false, message: "Could not send your message. Please try again." });
  }
}
