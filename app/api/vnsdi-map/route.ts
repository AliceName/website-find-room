import { NextRequest, NextResponse } from "next/server";

const VNSDI_MAP_URL = "https://vnsdi.mae.gov.vn/bandohanhchinh/";

export async function GET(request: NextRequest) {
  const appOrigin = request.nextUrl.origin;
  const serviceRewrites = [
    {
      from: "https://vnsdi.mae.gov.vn/",
      to: `${appOrigin}/api/vnsdi-proxy/vnsdi/`,
    },
    {
      from: "https://dosm.vnsdi.gov.vn/",
      to: `${appOrigin}/api/vnsdi-proxy/dosm/`,
    },
  ];

  const response = await fetch(VNSDI_MAP_URL, {
    headers: {
      "user-agent": "Mozilla/5.0",
      referer: VNSDI_MAP_URL,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return new NextResponse("Không thể tải bản đồ VNSDI.", { status: 502 });
  }

  const sourceHtml = await response.text();
  const proxiedHtml = serviceRewrites.reduce(
    (html, rewrite) => html.replaceAll(rewrite.from, rewrite.to),
    sourceHtml,
  );
  const html = proxiedHtml.replace(
    /<head>/i,
    `<head><base href="${VNSDI_MAP_URL}"><meta name="referrer" content="origin">`,
  );

  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
