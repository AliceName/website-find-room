"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface RoomLocationMiniMapProps {
  lat: number;
  lng: number;
  title: string;
  locationText: string;
}

const roomPinIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid #fff;box-shadow:0 2px 10px rgba(37,99,235,.35)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function RoomLocationMiniMap({
  lat,
  lng,
  title,
  locationText,
}: RoomLocationMiniMapProps) {
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
