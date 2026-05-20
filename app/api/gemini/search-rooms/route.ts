import { NextResponse } from "next/server";
import {
  fetchSearchablePosts,
  rankRoomsWithGemini,
} from "@/lib/ai/room-search";
import {
  getGeminiApiKey,
  mapUnknownGeminiError,
  missingApiKeyResponse,
} from "@/lib/gemini/server";

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

  const query =
    typeof body === "object" &&
    body !== null &&
    "query" in body &&
    typeof (body as { query: unknown }).query === "string"
      ? (body as { query: string }).query.trim()
      : "";

  if (!query) {
    return NextResponse.json(
      { error: "Thiếu nội dung yêu cầu tìm phòng", code: "MISSING_QUERY" },
      { status: 400 },
    );
  }

  try {
    const posts = await fetchSearchablePosts();

    if (posts.length === 0) {
      return NextResponse.json({
        rooms: [],
        message:
          "Hiện chưa có tin phòng nào đang hoạt động. Vui lòng thử lại sau.",
      });
    }

    const { matches, aiSummary } = await rankRoomsWithGemini(
      apiKey,
      query,
      posts,
    );

    if (matches.length === 0) {
      return NextResponse.json({
        rooms: [],
        aiSummary:
          aiSummary ||
          "Không tìm thấy phòng phù hợp với yêu cầu. Hãy thử mô tả rộng hơn (khu vực, giá, diện tích).",
      });
    }

    return NextResponse.json({
      rooms: matches,
      aiSummary,
    });
  } catch (error) {
    return mapUnknownGeminiError(error);
  }
}
