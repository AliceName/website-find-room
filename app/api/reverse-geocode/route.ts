import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "YourAppName/1.0 (your@email.com)", // Nominatim requires this
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    return NextResponse.json({ error: `Nominatim error: ${response.status}` }, { status: 502 });
  }

  const data = await response.json();
  return NextResponse.json(data);
}