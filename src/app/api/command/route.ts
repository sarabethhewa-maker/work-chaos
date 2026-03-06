import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { command, characterNames } = await req.json();

  const systemPrompt = `You are a game master for a chaotic workplace simulator. Parse the user command and return ONLY a JSON object with: { "action": string, "characters": string[], "extra"?: string }
Actions can be: fight, chase, fly, cartwheel, say, all_cartwheel, all_fight, chaos_mode, dance, nap, meeting, panic, promote
Characters should match names from this list: [${characterNames.join(", ")}]
Example: 'have ryan chase lucas' -> { "action": "chase", "characters": ["ryan", "lucas"] }
Example: 'make everyone do cartwheels' -> { "action": "all_cartwheel", "characters": [] }
Example: 'make paul say something' -> { "action": "say", "characters": ["paul"] }
Example: 'make everyone dance' -> { "action": "dance", "characters": [] }
Example: 'put ryan to sleep' -> { "action": "nap", "characters": ["ryan"] }
Example: 'make ryan panic' -> { "action": "panic", "characters": ["ryan"] }
Example: 'promote ryan' -> { "action": "promote", "characters": ["ryan"] }
Example: 'start a meeting with ryan lucas and paul' -> { "action": "meeting", "characters": ["ryan", "lucas", "paul"] }
If a command says "everyone" or "all", use the all_ variant or include all characters. Match names case-insensitively. Return ONLY valid JSON, no explanation.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      system: systemPrompt,
      messages: [{ role: "user", content: command }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
