import { NextResponse } from "next/server";
import {
  chatRoomAssistantWithGemini,
  fetchSearchablePosts,
  type ChatMessageInput,
} from "@/lib/ai/room-search";
import {
  getGeminiApiKey,
  mapUnknownGeminiError,
  missingApiKeyResponse,
} from "@/lib/gemini/server";

const MAX_MESSAGES = 40;
const MAX_CONTENT_LENGTH = 4000;

function parseMessages(body: unknown): ChatMessageInput[] | null {
  if (
    typeof body !== "object" ||
    body === null ||
    !("messages" in body) ||
    !Array.isArray((body as { messages: unknown }).messages)
  ) {
    return null;
  }

  const raw = (body as { messages: unknown[] }).messages;
  const parsed: ChatMessageInput[] = [];

  for (const item of raw) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("role" in item) ||
      !("content" in item)
    ) {
      continue;
    }
    const role = (item as { role: unknown }).role;
    const content = (item as { content: unknown }).content;
    if (
      (role !== "user" && role !== "assistant") ||
      typeof content !== "string"
    ) {
      continue;
    }
    const trimmed = content.trim();
    if (!trimmed) continue;
    parsed.push({
      role,
      content: trimmed.slice(0, MAX_CONTENT_LENGTH),
    });
  }

  return parsed.length > 0 ? parsed.slice(-MAX_MESSAGES) : null;
}

export async function POST(request: Request) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return missingApiKeyResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON không hợp lệ", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const messages = parseMessages(body);
  if (!messages) {
    return NextResponse.json(
      {
        error: 'Thiếu mảng "messages" hợp lệ (role: user|assistant, content).',
        code: "INVALID_MESSAGES",
      },
      { status: 400 },
    );
  }

  const last = messages[messages.length - 1];
  if (last.role !== "user") {
    return NextResponse.json(
      {
        error: "Tin nhắn cuối trong mảng phải từ người dùng (role: user).",
        code: "INVALID_LAST_MESSAGE",
      },
      { status: 400 },
    );
  }

  try {
    const posts = await fetchSearchablePosts();

    if (posts.length === 0) {
      return NextResponse.json({
        reply:
          "Hiện chưa có tin phòng nào đang hoạt động trên hệ thống. Bạn vui lòng quay lại sau nhé!",
        rooms: [],
      });
    }

    const { reply, rooms } = await chatRoomAssistantWithGemini(
      apiKey,
      messages,
      posts,
    );

    return NextResponse.json({ reply, rooms });
  } catch (error) {
    return mapUnknownGeminiError(error);
  }
}
