import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  const reverseMode = lat !== null && lng !== null;

  if (!reverseMode && !address) {
    return NextResponse.json({ error: "Thiếu tham số q" }, { status: 400 });
  }

  try {
    const url = reverseMode
      ? `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat ?? "")}&lon=${encodeURIComponent(lng ?? "")}&addressdetails=1&zoom=18`
      : `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(address ?? "")}&limit=1&countrycodes=vn&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "website-find-room/1.0 (local development)",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Nominatim geocode failed", {
        status: response.status,
        statusText: response.statusText,
        body,
      });
      return NextResponse.json(
        { error: "Không thể truy vấn dịch vụ geocode" },
        { status: 502 },
      );
    }

    const data = await response.json();
    const result = reverseMode ? data : Array.isArray(data) ? data[0] : null;

    if (!result) {
      return NextResponse.json(
        { error: "Không tìm thấy tọa độ" },
        { status: 404 },
      );
    }

    const parsedLat = Number(result.lat);
    const parsedLng = Number(result.lon ?? result.lng);

    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
      return NextResponse.json(
        { error: "Dữ liệu tọa độ không hợp lệ" },
        { status: 502 },
      );
    }

    const addressData = result.address ?? {};
    const road = addressData.road ?? addressData.residential ?? addressData.pedestrian ?? addressData.path ?? addressData.footway ?? addressData.service ?? "";
    const houseNumber = addressData.house_number ?? "";
    const suburb = addressData.suburb ?? addressData.quarter ?? addressData.neighbourhood ?? "";
    const city = addressData.city ?? addressData.town ?? addressData.village ?? addressData.municipality ?? addressData.county ?? addressData.state ?? addressData.region ?? "";
    const district = addressData.city_district ?? addressData.district ?? addressData.county ?? addressData.suburb ?? "";
    const ward = addressData.suburb ?? addressData.quarter ?? addressData.neighbourhood ?? addressData.hamlet ?? "";

    const addressDetail = [houseNumber, road].filter(Boolean).join(" ").trim();
    const fullAddress = [addressDetail, ward, district, city].filter(Boolean).join(", ");

    return NextResponse.json({
      lat: parsedLat,
      lng: parsedLng,
      class: result.class,
      type: result.type,
      importance: Number(result.importance ?? 0),
      display_name: result.display_name,
      address: {
        city,
        district,
        ward,
        address_detail: addressDetail,
        full_address: fullAddress,
        road,
        house_number: houseNumber,
        suburb,
      },
    });
  } catch (error) {
    console.error("Geocode route error", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
