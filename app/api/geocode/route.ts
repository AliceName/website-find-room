import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("q");

  if (!address) {
    return NextResponse.json({ error: "Thiếu tham số q" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=vn`,
      {
        headers: {
          "User-Agent": "FindRoomHutech_Project_Student",
        },
      },
    );
    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      return NextResponse.json({
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        //  Trả thêm metadata để client tự phán đoán
        class: result.class, // "boundary", "place", "amenity", "building"...
        type: result.type, // "administrative", "city", "district", "house"...
        importance: result.importance, // 0.0 → 1.0
        display_name: result.display_name,
      });
    }

    return NextResponse.json(
      { error: "Không tìm thấy tọa độ" },
      { status: 404 },
    );
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
