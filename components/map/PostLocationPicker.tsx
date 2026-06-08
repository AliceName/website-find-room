"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { geocodeAddress } from "@/lib/services/geocode";
import { findBestAdministrativeMatch, isMeaningfulAdministrativeName } from "@/lib/utils/addressNormalization";
import { MAP_TILE_CONFIG } from "./mapTiles";

const DEFAULT_CENTER: [number, number] = [10.775060, 106.702191]; // TP.HCM
const DEFAULT_ZOOM = 15;
const PROVINCE_ZOOM = 9;
const DISTRICT_ZOOM = 12;

const pinIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});

type Coordinates = {
  latitude: number | null;
  longitude: number | null;
};

type ReverseGeocodeData = {
  city?: string;
  district?: string;
  ward?: string;
  address_detail?: string;
  full_address?: string;
};

type AddressParts = {
  city?: string;
  district?: string;
  address_detail?: string;
  full_address?: string;
};

function cleanAddressPart(value?: string) {
  return (value || "").replace(/\s+/g, " ").trim();
}

/**
 * Gom tất cả thông tin "dư" từ reverse geocode vào address_detail:
 * số nhà + tên đường + quarter/suburb/neighbourhood/village/hamlet/residential
 */
function buildAddressPartsFromReverseData(data: any): AddressParts {
  const addr = data?.address ?? {};

  const houseNumber = cleanAddressPart(addr.house_number);
  const road = cleanAddressPart(addr.road || addr.pedestrian || addr.footway || addr.path);

  // Các thành phần chi tiết nhỏ hơn quận (sẽ không được lưu vào city/district)
  // Loại suburb ra vì Nominatim VN dùng suburb = tên phường/xã
  const subLocality = cleanAddressPart(
    addr.quarter || addr.neighbourhood ||
    addr.village || addr.hamlet || addr.residential || addr.borough
  );

  // Gom: số nhà + tên đường + khu vực nhỏ
  const detailParts = [
    houseNumber && road ? `${houseNumber} ${road}` : (road || houseNumber),
    subLocality,
  ].filter(Boolean);

  const address_detail = detailParts.join(", ") || cleanAddressPart(data?.display_name);

  return {
    address_detail,
    full_address: cleanAddressPart(data?.display_name),
  };
}

const provinceCache = new Map<string, any[]>();
const allProvincesCache = { data: null as any[] | null };

interface PostLocationPickerProps {
  addressDetail?: string;
  city?: string;
  district?: string;
  ward?: string; // giữ để tương thích, không dùng
  latitude: number | null;
  longitude: number | null;
  onChange: (value: Coordinates) => void;
  onReverseGeocode?: (data: ReverseGeocodeData) => void;
}

interface AdministrativeLookupResult {
  city: string;
  district: string;
}

function ClickToPickLocation({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToLocation({ latitude, longitude, zoom }: { latitude: number; longitude: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([latitude, longitude], zoom, { animate: true, duration: 1.2 });
  }, [latitude, longitude, zoom, map]);
  return null;
}

export default function PostLocationPicker({
  addressDetail = "",
  city = "",
  district = "",
  ward = "",
  latitude,
  longitude,
  onChange,
  onReverseGeocode,
}: PostLocationPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string>("");
  const [manualPicked, setManualPicked] = useState(false);
  const [lockedByConfirm, setLockedByConfirm] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const selectMeaningful = (...values: Array<string | undefined>) =>
    values.find((v) => isMeaningfulAdministrativeName(v)) ?? "";

  const lookupAdministrativeParts = async (data: any): Promise<AdministrativeLookupResult> => {
    const address = data?.address || {};
    const displayParts = cleanAddressPart(data?.display_name)
      .split(",")
      .map((p) => cleanAddressPart(p))
      .filter(Boolean);

    const rawProvinceCandidates = [
      address.state,
      address.province,
      address.region,
      // Nominatim VN thường không có state/province, tỉnh có thể ở displayParts.at(-3)
      displayParts.at(-3),
      displayParts.at(-2),
    ].filter((v): v is string => Boolean(v));

    const rawWardCandidates = [
      address.suburb,
      address.quarter,
      address.neighbourhood,
      address.village,
      address.hamlet,
      address.county,
      displayParts.at(-5),
      displayParts.at(-4),
    ].filter((v): v is string => Boolean(v));

    // 1. Fetch tỉnh (có cache)
    if (!allProvincesCache.data) {
      const res = await fetch("https://provinces.open-api.vn/api/v2/p?depth=1");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      allProvincesCache.data = await res.json();
    }
    const provinces = allProvincesCache.data!;

    const province =
      rawProvinceCandidates.map((c) => findBestAdministrativeMatch(provinces, c)).find(Boolean) ??
      null;

    if (!province) {
      return { city: selectMeaningful(...rawProvinceCandidates), district: "" };
    }

    // 2. Fetch phường/xã của tỉnh (có cache)
    if (!provinceCache.has(province.code)) {
      const res = await fetch(`https://provinces.open-api.vn/api/v2/p/${province.code}?depth=2`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const detail = await res.json();
      provinceCache.set(province.code, detail?.wards ?? []);
    }
    const allWards = provinceCache.get(province.code)!;

    // 3. Tìm phường/xã
    const wardMatch =
      rawWardCandidates.map((c) => findBestAdministrativeMatch(allWards, c)).find(Boolean) ??
      null;

    return {
      city: province.name,
      district: wardMatch?.name ?? "",
    };
  };

  const applyReverseGeocodeData = (data: ReverseGeocodeData, location?: Coordinates) => {
    console.log("[PostLocationPicker] applyReverseGeocodeData", {
      data,
      location,
      currentState: {
        addressDetail,
        city,
        district,
        ward,
        latitude,
        longitude,
        lastQuery,
        manualPicked,
      },
    });
    onReverseGeocode?.(data);
    if (location) onChange(location);

    const nextQuery = [data.address_detail, data.ward || data.district, data.city].filter(Boolean).join(", ");
    setLastQuery(nextQuery);
    setManualPicked(false);
  };

  const addressDetailRef = useRef(addressDetail);

  useEffect(() => { setMounted(true); }, []);

  const query = useMemo(() => {
    const parts = [ward || district, city].filter(Boolean);
    if (addressDetail.trim()) parts.unshift(addressDetail.trim());
    return parts.join(", ");
  }, [addressDetail, city, district, ward]);

  useEffect(() => {
    if (!query || query.length < 5) return;
    if (manualPicked && latitude !== null && longitude !== null) return;
    if (lockedByConfirm) return;
    const addressDetailChanged = addressDetail !== addressDetailRef.current;
    if (addressDetailChanged) {
      addressDetailRef.current = addressDetail;
      return;
    }
    if (query === lastQuery) return;
    if (lastQuery && (query.includes(lastQuery) || lastQuery.includes(query))) return;

    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await geocodeAddress(query);
        if (!active || !result) return;

        if (!result.address?.city && !result.address?.address_detail) {
          if (active) onChange({ latitude: result.lat, longitude: result.lng });
          if (active) {
            setLastQuery(query);
          }
          return;
        }

        console.log("[PostLocationPicker] geocodeAddress result", {
          query,
          result,
          currentState: {
            addressDetail,
            city,
            district,
            ward,
            latitude,
            longitude,
            lastQuery,
            manualPicked,
            lockedByConfirm,
          },
        });

        applyReverseGeocodeData(
          {
            city: result.address?.city,
            district: result.address?.district,
            ward: result.address?.ward,
            address_detail: result.address?.address_detail,
            full_address: result.address?.full_address,
          },
          { latitude: result.lat, longitude: result.lng }
        );
      } catch (err) {
        if (!active) return;
        setError("Không thể tự xác định vị trí từ địa chỉ. Bạn có thể chạm vào bản đồ để chọn thủ công.");
      } finally {
        if (active) setLoading(false);
      }
    }, 700);

    return () => { active = false; clearTimeout(timer); };
  }, [query, latitude, longitude, lastQuery, manualPicked, lockedByConfirm]);

  const center: [number, number] =
    latitude !== null && longitude !== null ? [latitude, longitude] : DEFAULT_CENTER;
  const mapZoom = district.trim() ? DISTRICT_ZOOM : city.trim() ? PROVINCE_ZOOM : DEFAULT_ZOOM;

  if (!mounted) {
    return (
      <div className="space-y-3">
        <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-lg">
          <div className="h-[360px] w-full animate-pulse bg-gray-100" />
        </div>
        <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">Đang tải bản đồ...</div>
      </div>
    );
  }

  const handlePick = (lat: number, lng: number) => {
    setError(null);
    setManualPicked(true);
    onChange({ latitude: lat, longitude: lng });
  };

  const handleGetLocationCurrent = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!navigator.geolocation) { setError("Trình duyệt không hỗ trợ GPS"); return; }
    setError(null);
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setManualPicked(true);
        setIsLocating(false);
      },
      () => {
        setError("Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền GPS hoặc chạm vào bản đồ để chọn thủ công.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleConfirm = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (latitude === null || longitude === null) { setError("Chưa có tọa độ để xác nhận."); return; }
    setIsConverting(true);
    setLockedByConfirm(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/reverse-geocode?lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();

      console.log("[DEBUG] raw address fields", {
        state: data?.address?.state,
        province: data?.address?.province,
        region: data?.address?.region,
        suburb: data?.address?.suburb,
        quarter: data?.address?.quarter,
        neighbourhood: data?.address?.neighbourhood,
        village: data?.address?.village,
        hamlet: data?.address?.hamlet,
        county: data?.address?.county,
        city_district: data?.address?.city_district,
        district: data?.address?.district,
        displayParts: data?.display_name?.split(",").map((s: string) => s.trim()),
      });

      if (data?.display_name) {
        // Lấy address_detail gom đủ thông tin nhỏ
        const parts = buildAddressPartsFromReverseData(data);
        // Lookup tỉnh + quận (2 cấp)
        const matched = await lookupAdministrativeParts(data);

        console.log("[PostLocationPicker] reverse geocode mapped", {
          rawAddress: data?.address,
          display_name: data?.display_name,
          mapped: matched,
          parts,
        });

        applyReverseGeocodeData(
          {
            address_detail: parts.address_detail,
            city: matched.city,
            district: matched.district,
            full_address: [parts.address_detail, matched.district, matched.city].filter(Boolean).join(", "),
          },
          { latitude, longitude }
        );
      } else {
        setError("Không thể nhận diện được địa chỉ này.");
      }
    } catch {
      setError("Có lỗi xảy ra khi lấy tên đường.");
    } finally {
      setIsConverting(false);
      setTimeout(() => setLockedByConfirm(false), 2000);
    }
  };

  const handleReset = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      console.log("[PostLocationPicker] handleReset start", {
        query,
        currentState: {
          addressDetail,
          city,
          district,
          ward,
          latitude,
          longitude,
          lastQuery,
          manualPicked,
        },
      });
      const result = await geocodeAddress(query);
      if (!result) { setError("Không tìm thấy tọa độ phù hợp."); return; }
      applyReverseGeocodeData(
        {
          city: result.address?.city,
          district: result.address?.district,
          ward: result.address?.ward,
          address_detail: result.address?.address_detail,
          full_address: result.address?.full_address,
        },
        { latitude: result.lat, longitude: result.lng }
      );
    } catch {
      setError("Không thể định vị lại từ địa chỉ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
            Chọn vị trí trên bản đồ
          </label>
          <p className="text-sm text-gray-500">Chạm vào bản đồ để đặt ghim hoặc lấy vị trí hiện tại từ GPS.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleGetLocationCurrent} disabled={isLocating}
            className="shrink-0 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50">
            {isLocating ? "Đang lấy GPS..." : "📍 Lấy vị trí hiện tại"}
          </button>

          <button type="button" onClick={handleConfirm} disabled={isConverting || latitude === null || longitude === null}
            className="shrink-0 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition-all hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50">
            {isConverting ? "⏳ Đang xác nhận..." : "✅ Xác nhận & Tự điền địa chỉ"}
          </button>

          <button type="button" onClick={handleReset} disabled={loading || !query}
            className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "🔄 Đang định vị..." : "🔄 Định vị lại"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          ⚠️ {error}
        </div>
      )}

      <div className="relative z-0 overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-lg">
        <div className="relative h-[360px] w-full">
          <MapContainer
            center={center}
            zoom={latitude && longitude ? mapZoom : 13}
            style={{ height: "100%", width: "100%", position: "relative", zIndex: 0 }}
          >
            <TileLayer attribution={MAP_TILE_CONFIG.attribution} url={MAP_TILE_CONFIG.url} />
            <ClickToPickLocation onPick={handlePick} />
            {latitude !== null && longitude !== null && (
              <>
                <FlyToLocation latitude={latitude} longitude={longitude}
                  zoom={district.trim() ? DISTRICT_ZOOM : city.trim() ? PROVINCE_ZOOM : DEFAULT_ZOOM} />
                <Marker position={[latitude, longitude]} icon={pinIcon} draggable={false}>
                  <Popup>
                    <div className="space-y-1 text-sm">
                      <p className="font-bold text-gray-800">📍 Vị trí đã chọn</p>
                      <p className="text-gray-600">{[ward || district, city].filter(Boolean).join(", ") || "Chưa có địa chỉ"}</p>
                    </div>
                  </Popup>
                </Marker>
              </>
            )}
          </MapContainer>
        </div>
      </div>

      <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
        <span className="font-semibold text-gray-800">🎯 Tọa độ:</span>{" "}
        {latitude !== null && longitude !== null
          ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          : "Chưa chọn vị trí"}
      </div>
    </div>
  );
}
