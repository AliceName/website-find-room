"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { geocodeAddress } from "@/lib/services/geocode";

const DEFAULT_CENTER: [number, number] = [10.775060, 106.702191]; // TP.HCM
const DEFAULT_ZOOM = 15;
const PROVINCE_ZOOM = 9;
const DISTRICT_ZOOM = 12;
const WARD_ZOOM = 15;

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

interface PostLocationPickerProps {
  addressDetail?: string;
  city?: string;
  district?: string;
  ward?: string;
  latitude: number | null;
  longitude: number | null;
  onChange: (value: Coordinates) => void;
  onReverseGeocode?: (data: {
    city?: string;
    district?: string;
    ward?: string;
    address_detail?: string;
    full_address?: string;
  }) => void;
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
    map.flyTo([latitude, longitude], zoom, {
      animate: true,
      duration: 1.2,
    });
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string>("");
  const [manualPicked, setManualPicked] = useState(false);

  const query = useMemo(() => {
    const parts = [ward, district, city].filter(Boolean);
    if (addressDetail.trim()) parts.unshift(addressDetail.trim());
    return parts.join(", ");
  }, [addressDetail, ward, district, city]);

  useEffect(() => {
    if (!query || query.length < 5) return;
    if (manualPicked && latitude !== null && longitude !== null) return;
    if (query === lastQuery) return;

    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await geocodeAddress(query);
        if (!active || !result) return;
        onChange({ latitude: result.lat, longitude: result.lng });
        onReverseGeocode?.({
          city: result.address?.city,
          district: result.address?.district,
          ward: result.address?.ward,
          address_detail: result.address?.address_detail,
          full_address: result.address?.full_address,
        });
        setLastQuery(query);
        setManualPicked(false);
      } catch (err) {
        if (!active) return;
        console.error("PostLocationPicker geocode error:", err);
        setError("Không thể tự xác định vị trí từ địa chỉ. Bạn có thể chạm vào bản đồ để chọn thủ công.");
      } finally {
        if (active) setLoading(false);
      }
    }, 700);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, latitude, longitude, lastQuery, manualPicked, ward, district, city, onChange]);

  const center: [number, number] =
    latitude !== null && longitude !== null ? [latitude, longitude] : DEFAULT_CENTER;

  const handlePick = (lat: number, lng: number) => {
    setError(null);
    setManualPicked(true);
    onChange({ latitude: lat, longitude: lng });
  };

  const handleReset = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const result = await geocodeAddress(query);
      if (!result) {
        setError("Không tìm thấy tọa độ phù hợp. Vui lòng chạm vào bản đồ để chọn.");
        return;
      }
      onChange({ latitude: result.lat, longitude: result.lng });
      onReverseGeocode?.({
        city: result.address?.city,
        district: result.address?.district,
        ward: result.address?.ward,
        address_detail: result.address?.address_detail,
        full_address: result.address?.full_address,
      });
      setLastQuery(query);
      setManualPicked(false);
    } catch (err) {
      console.error("Reset pin geocode error:", err);
      setError("Không thể định vị lại từ địa chỉ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
            Chọn vị trí trên bản đồ
          </label>
          <p className="text-sm text-gray-500">
            Chạm vào bản đồ để đặt ghim hoặc dùng địa chỉ để tự động định vị.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={loading || !query}
          className="shrink-0 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition-all hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Đang định vị..." : "Định vị lại"}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-lg">
        <div className="h-[360px] w-full">
          <MapContainer center={center} zoom={latitude && longitude ? DEFAULT_ZOOM : 13} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <ClickToPickLocation onPick={handlePick} />

            {latitude !== null && longitude !== null && (
              <>
                <FlyToLocation
                  latitude={latitude}
                  longitude={longitude}
                  zoom={ward.trim() ? WARD_ZOOM : district.trim() ? DISTRICT_ZOOM : city.trim() ? PROVINCE_ZOOM : DEFAULT_ZOOM}
                />
                <Marker position={[latitude, longitude]} icon={pinIcon} draggable={false}>
                  <Popup>
                    <div className="space-y-1 text-sm">
                      <p className="font-bold text-gray-800">Vị trí đã chọn</p>
                      <p className="text-gray-600">{[ward, district, city].filter(Boolean).join(", ") || "Chưa có địa chỉ"}</p>
                    </div>
                  </Popup>
                </Marker>
              </>
            )}
          </MapContainer>
        </div>
      </div>

      <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
        <span className="font-semibold text-gray-800">Tọa độ:</span>{" "}
        {latitude !== null && longitude !== null
          ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          : "Chưa chọn vị trí"}
      </div>
    </div>
  );
}
