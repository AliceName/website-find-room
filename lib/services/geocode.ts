
export type LocationResult = {
  lat: number;
  lng: number;
  class: string; // "boundary", "place", "amenity", "building"...
  type: string; // "administrative", "city", "district", "house"...
  importance: number; // 0.0 → 1.0
  display_name: string;
  address?: {
    city?: string;
    district?: string;
    ward?: string;
    address_detail?: string;
    full_address?: string;
    road?: string;
    house_number?: string;
    suburb?: string;
  };
  // ✅ Kết quả phân tích — MapController dùng cái này để quyết định có lọc 20km không
  isGeographic: boolean;
};

// Các loại class/type được coi là địa danh hành chính thật
const GEOGRAPHIC_CLASSES = new Set(["boundary", "place"]);
const GEOGRAPHIC_TYPES = new Set([
  "administrative",
  "city",
  "town",
  "village",
  "suburb",
  "district",
  "quarter",
  "neighbourhood",
  "municipality",
  "county",
  "state",
  "region",
]);
const IMPORTANCE_THRESHOLD = 0.4; // dưới ngưỡng này → coi là mô tả, không phải địa danh

const cache: Record<string, LocationResult> = {};

export async function geocodeAddress(
  keyword: string,
): Promise<LocationResult | null> {
  if (!keyword || keyword.trim() === "") return null;

  const cacheKey = keyword.trim().toLowerCase();

  try {
    if (cache[cacheKey]) return cache[cacheKey];

    const res = await fetch(`/api/geocode?q=${encodeURIComponent(keyword)}`);

    if (!res.ok) {
      console.warn(`Geocode API returned status: ${res.status}`);
      return null;
    }

    const data = await res.json();

    if (!data || data.error || data.lat === undefined || data.lng === undefined) {
      return null;
    }

    // ✅ Phân tích xem có phải địa danh hành chính không
    const isGeographic =
      (GEOGRAPHIC_CLASSES.has(data.class) || GEOGRAPHIC_TYPES.has(data.type)) &&
      (data.importance ?? 0) >= IMPORTANCE_THRESHOLD;

    const lat = Number(data.lat);
    const lng = Number(data.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const result: LocationResult = {
      lat,
      lng,
      class: data.class ?? "",
      type: data.type ?? "",
      importance: Number(data.importance ?? 0),
      display_name: data.display_name ?? "",
      isGeographic,
    };

    cache[cacheKey] = result;
    return result;
  } catch (err) {
    console.error("Geocode error:", err);
    return null;
  }
}