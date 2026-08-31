import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAnthropic, BRAIN_MODEL } from "../../_lib/anthropic";
import { buildSystemPrompt } from "../../_lib/profile";

interface OpenAiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface BrainRequestBody {
  model?: string;
  messages?: OpenAiMessage[];
  stream?: boolean;
}

function chunk(id: string, model: string, contentDelta: string | null, finishReason: string | null) {
  const payload = {
    id,
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        delta: contentDelta !== null ? { content: contentDelta } : {},
        finish_reason: finishReason,
      },
    ],
  };
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const expectedSecret = process.env.ELEVENLABS_CUSTOM_LLM_SECRET;
  const authHeader = req.headers.authorization;
  const providedSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!expectedSecret || providedSecret !== expectedSecret) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { messages = [], stream = true }: BrainRequestBody = req.body ?? {};
  const conversationMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const responseId = `brain-${Date.now()}`;

  try {
    if (!stream) {
      const message = await getAnthropic().messages.create({
        model: BRAIN_MODEL,
        max_tokens: 1024,
        system: buildSystemPrompt(),
        messages: conversationMessages,
      });
      const text = message.content
        .filter((b) => b.type === "text")
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("");

      res.status(200).json({
        id: responseId,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: BRAIN_MODEL,
        choices: [
          { index: 0, message: { role: "assistant", content: text }, finish_reason: "stop" },
        ],
      });
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const anthropicStream = getAnthropic().messages.stream({
      model: BRAIN_MODEL,
      max_tokens: 1024,
      system: buildSystemPrompt(),
      messages: conversationMessages,
    });

    anthropicStream.on("text", (textDelta) => {
      res.write(chunk(responseId, BRAIN_MODEL, textDelta, null));
    });

    anthropicStream.on("end", () => {
      res.write(chunk(responseId, BRAIN_MODEL, null, "stop"));
      res.write("data: [DONE]\n\n");
      res.end();
    });

    anthropicStream.on("error", (err) => {
      console.error("[v1/chat/completions] stream error", err);
      res.write("data: [DONE]\n\n");
      res.end();
    });
  } catch (err) {
    console.error("[v1/chat/completions]", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Brain endpoint failed." });
    } else {
      res.end();
    }
  }
}
