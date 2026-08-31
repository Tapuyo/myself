# Project Plan: AI-Powered Portfolio Website ("Call My AI Self")

**Owner:** John Paul Tapuyo
**Stack:** React + Vercel Serverless Functions (single-app deploy, no dedicated backend server)
**Core idea:** A portfolio site where visitors can either read about you or *call your AI self* — a voice agent that answers questions about your work using your resume as its knowledge base, then emails you a summary + the caller's contact info.

---

## 1. Clarifying "No Backend"

Vercel can't run Claude/ElevenLabs calls straight from the browser — those API keys would be exposed publicly and rate-limiting couldn't be enforced. So "no backend" is interpreted as: **no separate server you have to host/manage** (no Express/Node server, no Railway/Render instance). Instead, everything lives in **one repo, one Vercel deployment**:

- `/` → React app (Vite or CRA) — the static site
- `/api/*` → Vercel Serverless Functions — small, single-purpose endpoints that hold your secret keys and do the sensitive work (talking to Claude, ElevenLabs, Supabase, email)

This is still "one app" from a deployment/ops standpoint — one `vercel.json`, one `git push` to deploy — it just isn't 100% static.

---

## 2. Architecture Overview

```
Visitor Browser
   │
   ├── Static React site (About / Skills / Projects / Experience / Contact)
   │
   └── "Call My AI Self" widget
         │
         ├─(1) POST /api/call/start   → checks IP + Supabase rate-limit table
         │                              → returns "allowed" + a signed session token
         │
         ├─(2) ElevenLabs Conversational AI SDK (client-side, public agent ID)
         │      opens a real-time voice session directly with ElevenLabs
         │      (mic in → speech, agent voice out)
         │        │
         │        └─ ElevenLabs agent is configured with a "Custom LLM" endpoint
         │           → POST /api/llm/brain  (Vercel function)
         │              → this function is an OpenAI-compatible proxy that
         │                internally calls Claude with your resume + bio as
         │                system context, and streams the reply back
         │
         ├─(3) Client enforces a 3-minute hard cap (timer) and ends the call;
         │      ElevenLabs also supports a max-duration setting server-side as backup
         │
         └─(4) POST /api/call/end  → sends the transcript to Claude for a
                summary + extracted visitor info (name/email/reason if given)
                → writes to Supabase (contacts + call_summaries)
                → sends you an email with the summary
```

Two integration paths exist for the voice layer — decide early (see §7):

- **Path A (recommended): ElevenLabs Agents Platform + Custom LLM.** ElevenLabs handles STT, turn-taking, and TTS; your `/api/llm/brain` function is a thin OpenAI-compatible proxy in front of Claude. Least code, lowest latency, best voice quality.
- **Path B (more control, more work): Roll your own.** Browser mic → Web Speech API or ElevenLabs STT → your own `/api/chat` (Claude) → ElevenLabs TTS for the reply audio. More moving parts, more places for latency/bugs, but zero dependency on ElevenLabs' agent orchestration.

---

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite), Tailwind CSS, matches the mockup you shared |
| Voice agent | ElevenLabs Conversational AI (Agents Platform) |
| LLM | Claude (via your API key, through the custom-LLM proxy function) |
| Serverless functions | Vercel Functions (Node.js, in `/api`) |
| Database | Supabase (Postgres) — contact submissions, call logs, rate-limit counters |
| Email | Resend or SendGrid (both have generous free tiers and a simple Node SDK — pick one; Nodemailer+SMTP also works but is more setup) |
| Hosting | Vercel |
| Content source | Your resume PDF + provided images, hand-converted into structured data (JSON) that both the website UI and the AI's system prompt pull from |

---

## 4. Data Model (Supabase)

**`contacts`** — anyone who submits the "Contact Us" form or gets identified during a call
- `id`, `name`, `email`, `phone` (optional), `message`, `source` (`contact_form` | `ai_call`), `created_at`

**`call_sessions`**
- `id`, `ip_address`, `ip_hash` (for privacy — see §6), `started_at`, `ended_at`, `duration_seconds`, `visitor_name`, `visitor_email`, `summary`, `transcript` (optional, if you want to keep full transcripts), `created_at`

**`rate_limits`**
- `ip_hash`, `call_date` (date only), `call_count`
- Unique constraint on `(ip_hash, call_date)`; increment on each call start; reject at `call_count >= 2`
- A daily cron (or just a `call_date` comparison at query time) makes the reset "automatic" — you don't need to actually clear rows, just always filter by today's date

---

## 5. API Functions (all under `/api`)

| Endpoint | Purpose |
|---|---|
| `POST /api/call/start` | Look up caller IP → check `rate_limits` for today → if under 2, upsert/increment and return an allow token; else return 429 with a friendly "come back tomorrow" message |
| `POST /api/llm/brain` | OpenAI-compatible chat-completions endpoint that ElevenLabs calls mid-conversation; injects your resume/bio as system prompt, calls Claude, streams response back in the format ElevenLabs expects |
| `POST /api/call/end` | Receives the transcript, asks Claude to produce a structured summary (visitor intent, name/email if mentioned, key questions asked), writes to Supabase, triggers the email |
| `POST /api/contact` | Handles the normal "Contact Us" form → writes to `contacts` → optionally emails you too |

Enforcing the **3-minute cap**: set it client-side (auto hang-up timer) AND, if using ElevenLabs Agents, set the agent's own max-session-duration in its config as a second layer — don't rely on the client alone, since it's trivial to bypass.

---

## 6. Security & Privacy Notes

- Claude key, ElevenLabs key, Supabase service-role key, and email API key live **only** as Vercel environment variables, read inside `/api` functions — never shipped to the browser bundle. Only the ElevenLabs *public agent ID* (not a secret) goes client-side.
- Get visitor IP from Vercel's forwarded headers (`x-forwarded-for`) inside the serverless function — don't trust anything the client sends about its own IP.
- Consider hashing the IP (e.g., SHA-256 with a server-side salt) before storing it in Supabase, rather than storing raw IPs — good practice if this data isn't strictly needed in plain form.
- Add a short privacy note near the call button ("Calls are transcribed and summarized to help me follow up with you") since you're capturing voice + contact data.

---

## 7. Decisions to Lock In Before Building

1. **Path A vs Path B** for the voice pipeline (recommend A — ElevenLabs Agents + custom LLM proxy).
2. **Email provider** — Resend, SendGrid, or something you already use.
3. **How much of the transcript to store** — full transcript + summary, or summary only (smaller Supabase footprint, less sensitive data retained).
4. **What the AI is allowed to say** — should it just discuss your resume/projects, or also try to qualify leads (e.g., ask visitor's project needs)? This shapes the system prompt.
5. **Design fidelity** — build the exact layout from the reference image, or use it as a style guide and adjust content to your actual resume (the image uses a placeholder name/photo — your resume has different specifics like 12+ years experience, AI/Flutter focus, etc.)

---

## 8. Suggested Build Order

1. **Content pass** — turn resume into structured JSON (bio, skills, experience, projects) that feeds both the UI and the AI's system prompt. One source of truth.
2. **Static site** — build the layout (Home/About/Skills/Projects/Experience/Contact) from the reference design, wired to the JSON content. Deploy early to Vercel to confirm the pipeline works.
3. **Contact form + Supabase + email** — smallest end-to-end slice (form → `/api/contact` → Supabase → email). Validates your Supabase/email setup before the harder voice piece.
4. **Rate limiting** — `rate_limits` table + `/api/call/start`, testable independently with curl/Postman before wiring up voice.
5. **Voice agent** — set up ElevenLabs agent, build `/api/llm/brain` custom-LLM proxy, wire the client SDK into the "Call My AI Self" widget.
6. **Call wrap-up** — transcript → summary → Supabase → email, plus the 3-minute cap (client timer + agent-side max duration).
7. **Polish & QA** — test rate limiting from multiple IPs/devices, test call cutoff at 3 minutes, check mobile layout, check email formatting.

---

## 9. Open Risk Notes

- ElevenLabs conversational minutes and Claude tokens both cost money per call — with a 2-call/day/IP cap and 3-min hard limit, worst-case cost is bounded, but worth checking current ElevenLabs Agents Platform pricing before launch.
- IP-based rate limiting is easy to work around (VPN, mobile data reset) — good enough to stop casual abuse, not bulletproof. Fine for a portfolio site.
- Vercel serverless functions have execution time limits depending on your plan — confirm the custom-LLM proxy's streaming response works within those limits.
