import {
  GoogleGenerativeAIFetchError,
  GoogleGenerativeAIResponseError,
} from "@google/generative-ai";
import { NextResponse } from "next/server";

export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite";

const DEFAULT_GEMINI_MODEL_CANDIDATES = [GEMINI_MODEL, "gemini-3.1-flash-lite", "gemini-3.1-flash"];

const PLACEHOLDER_KEYS = new Set([
  "YOUR_GEMINI_KEY",
  "your_gemini_api_key",
  "your_google_api_key",
]);

/** Google SDK: GOOGLE_API_KEY wins when both env vars are set. */
export function getGeminiApiKey(): string | undefined {
  const key =
    process.env.GOOGLE_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (!key || PLACEHOLDER_KEYS.has(key)) {
    return undefined;
  }
  return key;
}

export type GeminiErrorBody = {
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
        {
          status:
            (error.status ?? 502) >= 400 && (error.status ?? 502) < 600
              ? (error.status ?? 502)
              : 502,
        },
      );
  }
}

export function mapUnknownGeminiError(
  error: unknown,
): NextResponse<GeminiErrorBody> {
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
  console.error("Gemini error", error);

  return NextResponse.json(
    {
      error: message || "Lỗi server không xác định.",
      code: "INTERNAL_ERROR",
    },
    { status: 500 },
  );
}

export function missingApiKeyResponse(): NextResponse<GeminiErrorBody> {
  return NextResponse.json(
    {
      error:
        "Thiếu hoặc chưa cấu hình GEMINI_API_KEY hoặc GOOGLE_API_KEY trong .env.local (ưu tiên GOOGLE_API_KEY nếu có cả hai). Mặc định đang dùng gemini-3.1-flash-lite.",
      code: "MISSING_API_KEY",
    },
    { status: 503 },
  );
}

export function getGeminiModelCandidates(): string[] {
  return Array.from(new Set(DEFAULT_GEMINI_MODEL_CANDIDATES.map((m) => m.trim()).filter(Boolean)));
}
