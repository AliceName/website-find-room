import { NextResponse } from "next/server";

const ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY?.trim();
const ORS_PROFILE = process.env.OPENROUTESERVICE_PROFILE?.trim() || "driving-car";

type RouteBody = {
  origin?: string;
  destination?: string;
  mode?: string;
};

function parseCoords(value: string | undefined) {
  if (!value) return null;
  const parts = value.split(",").map((n) => Number(n.trim()));
  if (parts.length !== 2 || parts.some((n) => !Number.isFinite(n))) return null;
  const [lng, lat] = parts;
  return { lng, lat };
}

export async function POST(request: Request) {
  if (!ORS_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Thiếu OPENROUTESERVICE_API_KEY trong .env.local để gọi routing API.",
        code: "MISSING_ROUTING_KEY",
      },
      { status: 503 },
    );
  }

  let body: RouteBody;
  try {
    body = (await request.json()) as RouteBody;
  } catch {
    return NextResponse.json(
      { error: "Body JSON không hợp lệ", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const origin = parseCoords(body.origin);
  const destination = parseCoords(body.destination);

  if (!origin || !destination) {
    return NextResponse.json(
      {
        error:
          "Thiếu hoặc sai tọa độ origin/destination (định dạng: lng,lat).",
        code: "INVALID_COORDS",
      },
      { status: 400 },
    );
  }

  const profile = body.mode?.trim() || ORS_PROFILE;

  try {
    const res = await fetch(
      `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
      {
        method: "POST",
        headers: {
          Authorization: ORS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coordinates: [
            [origin.lng, origin.lat],
            [destination.lng, destination.lat],
          ],
        }),
      },
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            data?.message ||
            data?.error ||
            "Không lấy được tuyến đường.",
          code: "ROUTING_API_ERROR",
          debug: {
            upstreamStatus: res.status,
            upstreamStatusText: res.statusText,
            upstreamBody: data,
            profile,
            origin,
            destination,
          },
        },
        { status: res.status },
      );
    }

    const route = data?.features?.[0]?.properties?.segments?.[0];
    const geometry = data?.features?.[0]?.geometry?.coordinates;

    if (!route || !Array.isArray(geometry)) {
      return NextResponse.json(
        {
          error: "Routing API không trả về dữ liệu hợp lệ.",
          code: "INVALID_ROUTING_RESPONSE",
          debug: {
            upstreamStatus: res.status,
            upstreamStatusText: res.statusText,
            upstreamBody: data,
            profile,
            origin,
            destination,
          },
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      route: {
        distance: route.distance,
        duration: route.duration,
        geometry,
      },
      debug: {
        upstreamStatus: res.status,
        profile,
        origin,
        destination,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi routing không xác định.";
    return NextResponse.json(
      { error: message, code: "ROUTING_REQUEST_FAILED" },
      { status: 500 },
    );
  }
}
