import { NextRequest, NextResponse } from "next/server";

const SOURCE_ORIGINS = {
  vnsdi: "https://vnsdi.mae.gov.vn",
  dosm: "https://dosm.vnsdi.gov.vn",
} as const;

type Source = keyof typeof SOURCE_ORIGINS;

type RouteParams = {
  params: Promise<{
    source: string;
    path: string[];
  }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { source, path } = await params;

  if (!isSource(source)) {
    return new NextResponse("Nguồn VNSDI không hợp lệ.", { status: 400 });
  }

  const upstreamUrl = new URL(path.join("/"), SOURCE_ORIGINS[source]);
  upstreamUrl.search = request.nextUrl.search;

  const response = await fetch(upstreamUrl, {
    headers: {
      accept: request.headers.get("accept") ?? "*/*",
      "accept-language": "vi,en-US;q=0.9,en;q=0.8",
      referer: "https://vnsdi.mae.gov.vn/bandohanhchinh/",
      "user-agent":
        request.headers.get("user-agent") ??
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    cache: "no-store",
  });

  const headers = new Headers();
  const contentType = response.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("cache-control", "no-store");

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function isSource(source: string): source is Source {
  return source in SOURCE_ORIGINS;
}
