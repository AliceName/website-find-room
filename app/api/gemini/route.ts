import {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
  GoogleGenerativeAIResponseError,
} from "@google/generative-ai";
import { NextResponse } from "next/server";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";

const PLACEHOLDER_KEYS = new Set([
  "YOUR_GEMINI_KEY",
  "your_gemini_api_key",
  "your_google_api_key",
]);

/** Google SDK: GOOGLE_API_KEY wins when both env vars are set. */
function getGeminiApiKey(): string | undefined {
  const key =
    process.env.GOOGLE_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (!key || PLACEHOLDER_KEYS.has(key)) {
    return undefined;
  }
  return key;
}

type GeminiErrorBody = {
  error: string;
  code?: string;
  retryAfter?: string;
};

function getRetryAfter(
  error: GoogleGenerativeAIFetchError,
): string | undefined {
  const retryInfo = error.errorDetails?.find(
    (detail) =>
      detail["@type"] === "type.googleapis.com/google.rpc.RetryInfo",
  ) as { retryDelay?: string } | undefined;

  return retryInfo?.retryDelay;
}

function mapGeminiFetchError(
  error: GoogleGenerativeAIFetchError,
): NextResponse<GeminiErrorBody> {
  const retryAfter = getRetryAfter(error);

  switch (error.status) {
    case 400:
      return NextResponse.json(
        {
          error: "Yêu cầu không hợp lệ (kiểm tra prompt hoặc tên model).",
          code: "BAD_REQUEST",
        },
        { status: 400 },
      );
    case 401:
    case 403:
      return NextResponse.json(
        {
          error: "API key Gemini không hợp lệ hoặc không có quyền truy cập.",
          code: "AUTH_ERROR",
        },
        { status: error.status },
      );
    case 404:
      return NextResponse.json(
        {
          error: `Model "${GEMINI_MODEL}" không tồn tại hoặc không khả dụng. Kiểm tra GEMINI_MODEL trong .env.local.`,
          code: "MODEL_NOT_FOUND",
        },
        { status: 404 },
      );
    case 429:
      return NextResponse.json(
        {
          error:
            "Đã vượt hạn mức Gemini API (quota/rate limit). Thử lại sau, đổi model, hoặc bật billing tại Google AI Studio.",
          code: "QUOTA_EXCEEDED",
          retryAfter,
        },
        { status: 429 },
      );
    default:
      return NextResponse.json(
        {
          error: `Lỗi Gemini API (${error.status} ${error.statusText}).`,
          code: "GEMINI_API_ERROR",
          retryAfter,
        },
        { status: error.status >= 400 && error.status < 600 ? error.status : 502 },
      );
  }
}

function mapUnknownError(error: unknown): NextResponse<GeminiErrorBody> {
  if (error instanceof GoogleGenerativeAIFetchError) {
    return mapGeminiFetchError(error);
  }

  if (error instanceof GoogleGenerativeAIResponseError) {
    return NextResponse.json(
      {
        error:
          "Gemini từ chối hoặc không trả về nội dung (có thể do safety filter).",
        code: "EMPTY_OR_BLOCKED_RESPONSE",
      },
      { status: 422 },
    );
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error("Gemini route error", error);

  return NextResponse.json(
    {
      error: message || "Lỗi server không xác định.",
      code: "INTERNAL_ERROR",
    },
    { status: 500 },
  );
}

export async function POST(request: Request) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Thiếu hoặc chưa cấu hình GEMINI_API_KEY hoặc GOOGLE_API_KEY trong .env.local (ưu tiên GOOGLE_API_KEY nếu có cả hai).",
        code: "MISSING_API_KEY",
      },
      { status: 503 },
    );
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

  const prompt =
    typeof body === "object" &&
    body !== null &&
    "prompt" in body &&
    typeof (body as { prompt: unknown }).prompt === "string"
      ? (body as { prompt: string }).prompt.trim()
      : "";

  if (!prompt) {
    return NextResponse.json(
      { error: "Thiếu nội dung prompt", code: "MISSING_PROMPT" },
      { status: 400 },
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    if (!text) {
      return NextResponse.json(
        {
          error: "Gemini không trả về nội dung.",
          code: "EMPTY_RESPONSE",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    return mapUnknownError(error);
  }
}
