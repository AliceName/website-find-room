import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import {
  GEMINI_MODEL,
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
    return mapUnknownGeminiError(error);
  }
}
