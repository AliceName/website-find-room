import { NextResponse } from "next/server";

const PROVINCES_BASE = "https://provinces.open-api.vn/api/v2";

function buildUrl(request: Request) {
  const { searchParams } = new URL(request.url);
  const pathname = searchParams.get("pathname") || "";
  const query = searchParams.get("query") || "";
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const suffix = query ? `?${query}` : "";
  return `${PROVINCES_BASE}${normalizedPath}${suffix}`;
}

export async function GET(request: Request) {
  const upstreamUrl = buildUrl(request);

  try {
    const res = await fetch(upstreamUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "website-find-room/1.0 (local development)",
      },
    });

    const contentType = res.headers.get("content-type") || "application/json";
    const body = contentType.includes("application/json") ? await res.json() : await res.text();

    if (!res.ok) {
      return NextResponse.json(
        {
          error: "Không thể truy vấn danh sách địa giới hành chính",
          upstreamStatus: res.status,
          upstreamStatusText: res.statusText,
          upstreamBody: body,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    return NextResponse.json(
      { error: "Không thể truy vấn danh sách địa giới hành chính", message },
      { status: 502 },
    );
  }
}
