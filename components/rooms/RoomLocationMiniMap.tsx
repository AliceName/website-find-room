"use client";

import { useEffect, useState } from "react";
import type L from "leaflet";

interface RoomLocationMiniMapProps {
  lat: number;
  lng: number;
  title: string;
  locationText: string;
}

export default function RoomLocationMiniMap({
  lat,
  lng,
  title,
  locationText,
}: RoomLocationMiniMapProps) {
  const [ready, setReady] = useState(false);
  const [MapParts, setMapParts] = useState<null | {
    MapContainer: typeof import("react-leaflet")["MapContainer"];
    Marker: typeof import("react-leaflet")["Marker"];
    Popup: typeof import("react-leaflet")["Popup"];
    TileLayer: typeof import("react-leaflet")["TileLayer"];
    roomPinIcon: L.DivIcon;
  }>(null);

  useEffect(() => {
    let active = true;

    async function loadMap() {
      const [{ MapContainer, Marker, Popup, TileLayer }, leaflet] = await Promise.all([
        import("react-leaflet"),
        import("leaflet"),
      ]);

      if (!active) return;

      await import("leaflet/dist/leaflet.css");

      const roomPinIcon = leaflet.divIcon({
        className: "",
        html: `<div style="width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid #fff;box-shadow:0 2px 10px rgba(37,99,235,.35)"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      setMapParts({ MapContainer, Marker, Popup, TileLayer, roomPinIcon });
      setReady(true);
    }

    void loadMap();

    return () => {
      active = false;
    };
  }, []);

  if (!ready || !MapParts) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-[2rem] border border-app bg-white shadow-sm">
        <div className="text-sm text-slate-500">Đang tải bản đồ...</div>
      </div>
    );
  }

  const { MapContainer, Marker, Popup, TileLayer, roomPinIcon } = MapParts;

  return (
    <div className="overflow-hidden rounded-[2rem] border border-app bg-white shadow-sm">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        minZoom={12}
        maxZoom={19}
        style={{ height: "280px", width: "100%" }}
        scrollWheelZoom={false}
        dragging
        doubleClickZoom
        zoomControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[lat, lng]} icon={roomPinIcon}>
          <Popup>
            <div className="min-w-[180px]">
              <p className="text-sm font-bold text-slate-900">{title}</p>
              <p className="mt-1 text-xs text-slate-600">{locationText}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
