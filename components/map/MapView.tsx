"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import L from "leaflet";
import {
    Circle,
    MapContainer,
    Marker,
    Popup,
    Polyline,
    TileLayer,
    useMap,
    useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { MapController } from "./MapController";

const postIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

const searchIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/447/447031.png",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
});

const userIcon = L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:9999px;background:#ef4444;border:3px solid #fff;box-shadow:0 2px 10px rgba(239,68,68,.35)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
});

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number) {
    if (!Number.isFinite(meters)) return "--";
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
}

function formatDuration(seconds: number) {
    if (!Number.isFinite(seconds)) return "--";
    const minutes = Math.max(1, Math.round(seconds / 60));
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining > 0 ? `${hours} giờ ${remaining} phút` : `${hours} giờ`;
}

function MapAutoResize() {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            const m = map as any;
            if (!m || !m._mapPane || !m.getContainer) return;
            const container = m.getContainer();
            if (!container || !container.isConnected) return;
            try { m.invalidateSize(); } catch { return; }
        }, 300);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
}

function PickLocationMarker({
    enabled,
    onPick,
}: {
    enabled: boolean;
    onPick: (lat: number, lng: number) => void;
}) {
    useMapEvents({
        click(e) {
            if (!enabled) return;
            onPick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function PostPopupCardWithActions({ p, isSelected, onSelect }: { p: any; isSelected?: boolean; onSelect?: () => void; }) {
    const thumbnail = p.rooms?.roomimages?.find((img: any) => img.is_360 === false)?.image_url ?? null;
    return (
        <div className={`overflow-hidden rounded-lg border bg-white transition-all ${isSelected ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-100 hover:border-blue-300 hover:shadow-md"}`}>
            {thumbnail ? (
                <button type="button" onClick={onSelect} className="relative block h-[120px] w-full overflow-hidden bg-gray-100 text-left">
                    <img src={thumbnail} alt={p.post_title} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                        <span className="text-sm font-black text-white">{p.rooms.room_price.toLocaleString("vi-VN")} đ</span>
                    </div>
                </button>
            ) : (
                <div className="relative flex h-[80px] items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
                    <span className="text-3xl">🏠</span>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent px-2 py-1">
                        <span className="text-sm font-black text-white">{p.rooms.room_price.toLocaleString("vi-VN")} đ</span>
                    </div>
                </div>
            )}
            <div className="p-2">
                <button type="button" onClick={onSelect} className="line-clamp-2 w-full text-left text-xs font-bold leading-snug text-gray-800 hover:text-blue-600">
                    {p.post_title}
                </button>
                <div className="mt-1.5 flex items-center justify-between">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">{p.rooms.room_area} m²</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                    <button type="button" onClick={onSelect} className="rounded-md bg-blue-600 px-2 py-1.5 text-[11px] font-bold text-white transition hover:bg-blue-700">Chọn tuyến</button>
                    <Link href={`/rooms/${p.post_id}`} onClick={(e) => e.stopPropagation()} className="rounded-md border border-blue-100 px-2 py-1.5 text-center text-[11px] font-bold text-blue-600 transition hover:bg-blue-50">Xem bài đăng</Link>
                </div>
            </div>
        </div>
    );
}

type RouteInfo = {
    distance: number;
    duration: number;
    geometry: [number, number][];
};

// Exposes the Leaflet map instance to imperative code outside MapContainer
function MapImperativeRef({ mapRef }: { mapRef: { current: L.Map | null } }) {
    const map = useMap();
    useEffect(() => { mapRef.current = map; return () => { mapRef.current = null; }; }, [map, mapRef]);
    return null;
}

// ─── MapCameraController: chỉ xử lý fitBounds khi có cả location lẫn post,
//     và flyTo user location khi mới định vị. Việc fly đến post mới đã được
//     handleSelectPost xử lý imperative → tránh double-fly.
function MapCameraController({
    currentLocation,
    selectedCoords,
    selectedPostId,
}: {
    currentLocation: { lat: number; lng: number } | null;
    selectedCoords: { lat: number; lng: number } | null;
    selectedPostId: string | null;
}) {
    const map = useMap();
    const prevLocationRef = useRef<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        const locationChanged =
            currentLocation?.lat !== prevLocationRef.current?.lat ||
            currentLocation?.lng !== prevLocationRef.current?.lng;
        prevLocationRef.current = currentLocation ?? null;

        const timer = setTimeout(() => {
            try {
                if (currentLocation && selectedCoords) {
                    // Có cả vị trí lẫn bài đăng → fit cả hai vào view
                    const bounds = L.latLngBounds(
                        [currentLocation.lat, currentLocation.lng],
                        [selectedCoords.lat, selectedCoords.lng]
                    );
                    if (bounds.isValid()) {
                        map.fitBounds(bounds.pad(0.28), { animate: true });
                        return;
                    }
                }

                if (currentLocation && !selectedCoords && locationChanged) {
                    // Mới định vị lần đầu, chưa chọn phòng → fly đến user
                    map.flyTo(
                        [currentLocation.lat, currentLocation.lng],
                        Math.max(map.getZoom(), 14),
                        { animate: true, duration: 1.2 }
                    );
                }
                // Trường hợp chỉ có selectedCoords (không có location) →
                // handleSelectPost đã flyTo imperative, không cần làm gì thêm
            } catch {
                // ignore transient map lifecycle errors
            }
        }, 150);

        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentLocation?.lat, currentLocation?.lng, selectedCoords?.lat, selectedCoords?.lng, selectedPostId]);

    return null;
}

// ─── FIX: RouteOverlay now also handles its own fitBounds ─────────────────────
function RouteOverlay({
    route,
    origin,
    destination,
    fallbackLine,
}: {
    route: RouteInfo | null;
    origin: { lat: number; lng: number } | null;
    destination: { lat: number; lng: number } | null;
    fallbackLine: [number, number][] | null;
}) {
    const map = useMap();

    useEffect(() => {
        if (!origin || !destination || !route?.geometry?.length) return;
        const bounds = L.latLngBounds([origin.lat, origin.lng], [destination.lat, destination.lng]);
        route.geometry.forEach(([lng, lat]) => bounds.extend([lat, lng]));
        if (bounds.isValid()) {
            map.fitBounds(bounds.pad(0.2), { animate: true });
        }
    }, [map, origin, destination, route]);

    if (route?.geometry?.length) {
        return <Polyline positions={route.geometry.map(([lng, lat]) => [lat, lng])} pathOptions={{ color: "#0ea5e9", weight: 5, opacity: 0.9 }} />;
    }
    return fallbackLine?.length
        ? <Polyline positions={fallbackLine} pathOptions={{ color: "#94a3b8", weight: 4, opacity: 0.85, dashArray: "8, 8" }} />
        : null;
}

function getPostKey(post: any): string | null {
    return post?.post_id ?? post?.rooms?.room_id ?? null;
}

export default function MapView({
    posts,
    filters,
    focusTarget,
    openRoutePanel,
}: {
    posts: any[];
    filters: any;
    focusTarget?: { lat: number; lng: number; title?: string; postId?: string } | null;
    openRoutePanel?: boolean;
}) {
    const defaultCenter: [number, number] = [10.8411, 106.8098];
    const mapRef = useRef<L.Map | null>(null);
    const markerRefs = useRef<Record<string, L.Marker | null>>({});
    const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedPost, setSelectedPost] = useState<any | null>(null);
    const [routePanelOpen, setRoutePanelOpen] = useState(false);
    const [route, setRoute] = useState<RouteInfo | null>(null);
    const [routeLoading, setRouteLoading] = useState(false);
    const [routeError, setRouteError] = useState<string | null>(null);
    const [routeDebug, setRouteDebug] = useState<string | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [locating, setLocating] = useState(false);
    const [pickMode, setPickMode] = useState(false);
    const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);

    const isGeographicSearch = useMemo(() => {
        const keyword = filters?.keyword?.toLowerCase() || "";
        const locationKeywords = ["quận", "huyện", "phường", "đường", "thành phố", "q.", "p.", "tp"];
        return locationKeywords.some((key) => keyword.includes(key)) || !!filters?.district;
    }, [filters]);

    const filteredPosts = useMemo(() => {
        if (searchLocation && isGeographicSearch) {
            return posts.filter((post) => {
                const lat = Number(post.rooms?.latitude);
                const lng = Number(post.rooms?.longitude);
                if (Number.isNaN(lat) || Number.isNaN(lng) || lat === 0 || lng === 0) return false;
                return getDistanceKm(searchLocation.lat, searchLocation.lng, lat, lng) <= 20;
            });
        }
        return posts;
    }, [posts, searchLocation, isGeographicSearch]);

    const groupedPosts = useMemo(() => {
        return filteredPosts.reduce((acc: Record<string, any[]>, post: any) => {
            const room = Array.isArray(post.rooms) ? post.rooms[0] : post.rooms;
            const lat = Number(room?.latitude);
            const lng = Number(room?.longitude);
            if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat !== 0 && lng !== 0) {
                const key = `${lat}-${lng}`;
                if (!acc[key]) acc[key] = [];
                acc[key].push({ ...post, rooms: { ...room, latitude: lat, longitude: lng } });
            }
            return acc;
        }, {});
    }, [filteredPosts]);

    useEffect(() => {
        if (openRoutePanel) setRoutePanelOpen(true);
    }, [openRoutePanel]);

    useEffect(() => {
        if (!focusTarget) return;
        const match = posts.find((post) => {
            const room = post.rooms;
            const lat = Number(room?.latitude);
            const lng = Number(room?.longitude);
            const byPostId = focusTarget.postId && post.post_id === focusTarget.postId;
            const byCoords = Number.isFinite(lat) && Number.isFinite(lng) && lat === focusTarget.lat && lng === focusTarget.lng;
            return byPostId || byCoords;
        });
        if (!match) return;

        handleSelectPost(match);

        const markerKey = Object.entries(groupedPosts).find(([, postsAtLocation]) =>
            postsAtLocation.some((p) => p.post_id === match.post_id)
        )?.[0];
        const marker = markerKey ? markerRefs.current[markerKey] : null;
        if (marker) {
            setTimeout(() => {
                try {
                    marker.openPopup();
                } catch {
                    // ignore transient map lifecycle errors
                }
            }, 0);
        }
    }, [focusTarget, posts, groupedPosts]);

    // ─── handleSelectPost: đóng popup ngay + fly đến marker bài đăng mới ─────
    function handleSelectPost(post: any) {
        const incomingKey = getPostKey(post);
        const currentKey = getPostKey(selectedPost);
        const isSamePost = incomingKey !== null && incomingKey === currentKey;

        if (isSamePost) {
            setRoutePanelOpen(true);
            return;
        }

        // Clear route cũ ngay lập tức
        setRoute(null);
        setRouteError(null);
        setRouteDebug(null);
        setSelectedPost(post);
        setRoutePanelOpen(true);

        // Imperative: đóng popup đang mở và fly đến vị trí bài đăng mới
        const map = mapRef.current;
        if (!map) return;
        const lat = Number(post.rooms?.latitude);
        const lng = Number(post.rooms?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) return;
        // Đóng toàn bộ popup đang mở (kể cả popup trên cluster marker)
        map.eachLayer((layer: any) => { if (typeof layer.closePopup === "function") layer.closePopup(); });
        map.closePopup();
        map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { animate: true, duration: 0.9 });
    };

    const selectedRoom = selectedPost?.rooms;
    const selectedThumbnail = selectedRoom?.roomimages?.find((img: any) => img.is_360 === false)?.image_url ?? null;
    const selectedLocation = selectedRoom?.locations
        ? [selectedRoom.locations.ward, selectedRoom.locations.district, selectedRoom.locations.city].filter(Boolean).join(", ")
        : "";

    const selectedCoords = useMemo(() => {
        if (!selectedRoom) return null;
        const lat = Number(selectedRoom.latitude);
        const lng = Number(selectedRoom.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) return null;
        return { lat, lng };
    }, [selectedRoom]);

    const routeOrigin = currentLocation ?? pickedLocation;

    const fallbackLine: [number, number][] | null =
        routeOrigin && selectedCoords
            ? [[routeOrigin.lat, routeOrigin.lng], [selectedCoords.lat, selectedCoords.lng]]
            : null;

    // routeKey gộp postId + coords → đảm bảo re-fetch kể cả khi 2 phòng cùng tọa độ
    const selectedPostId: string | null = selectedPost ? getPostKey(selectedPost) : null;
    const routeKey = `${selectedPostId ?? "none"}-${selectedCoords?.lat ?? 0}-${selectedCoords?.lng ?? 0}-${routeOrigin?.lat ?? 0}-${routeOrigin?.lng ?? 0}`;

    useEffect(() => {
        if (!routeOrigin || !selectedCoords) {
            setRoute(null);
            setRouteError(null);
            setRouteDebug(null);
            return;
        }

        const origin = `${routeOrigin.lng},${routeOrigin.lat}`;
        const destination = `${selectedCoords.lng},${selectedCoords.lat}`;

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setRouteLoading(true);
            setRouteError(null);
            setRouteDebug(null);
            try {
                const res = await fetch("/api/routing", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ origin, destination, mode: "driving-car" }),
                    signal: controller.signal,
                });
                const data = await res.json();
                if (!res.ok) {
                    setRoute(null);
                    setRouteError(data?.error || "Không lấy được tuyến đường.");
                    setRouteDebug(JSON.stringify({ status: res.status, code: data?.code, debug: data?.debug, payload: data }, null, 2));
                    return;
                }
                setRoute(data.route ?? null);
                setRouteDebug(JSON.stringify({ origin, destination, profile: "driving-car", route: data.route, debug: data?.debug }, null, 2));
            } catch (error) {
                if ((error as Error).name === "AbortError") return;
                setRoute(null);
                const message = error instanceof Error ? error.message : "Không lấy được tuyến đường.";
                setRouteError(message);
                setRouteDebug(JSON.stringify({ origin, destination, error: message }, null, 2));
            } finally {
                setRouteLoading(false);
            }
        }, 250);

        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeKey, routeOrigin?.lat, routeOrigin?.lng]);

    const handleClearSelection = () => {
        setSelectedPost(null);
        setRoute(null);
        setRouteError(null);
        setRouteDebug(null);
        setRoutePanelOpen(false);
        setPickedLocation(null);
        setPickMode(false);
    };

    const handleUseCurrentLocation = () => {
        setLocationError(null);
        setLocating(true);
        setPickMode(false);
        if (!navigator.geolocation) {
            setLocating(false);
            setLocationError("Trình duyệt không hỗ trợ định vị.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setPickedLocation(null);
                setLocating(false);
            },
            () => {
                setLocating(false);
                setLocationError("Bạn đã từ chối hoặc không lấy được vị trí hiện tại.");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        );
    };

    const handlePickLocationMode = () => {
        setLocationError(null);
        setCurrentLocation(null);
        setPickedLocation(null);
        setPickMode(true);
    };

    const handlePickedMapLocation = (lat: number, lng: number) => {
        setPickedLocation({ lat, lng });
        setPickMode(false);
        setCurrentLocation(null);
    };

    return (
        <div className="relative h-full w-full overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-xl">
            {/* Control bar */}
            <div className="absolute left-4 top-4 z-[1000] rounded-2xl border border-sky-100 bg-white/95 p-3 shadow-lg backdrop-blur">
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        className="rounded-xl bg-[#0EA5E9] px-3 py-2 text-xs font-bold text-white hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={locating}
                    >
                        {locating ? "Đang định vị..." : "Dùng vị trí hiện tại"}
                    </button>
                    <button
                        type="button"
                        onClick={handlePickLocationMode}
                        className={`rounded-xl px-3 py-2 text-xs font-bold transition ${pickMode ? "bg-amber-500 text-white hover:bg-amber-600" : "border border-amber-200 bg-white text-amber-700 hover:bg-amber-50"}`}
                    >
                        {pickMode ? "Đang chấm vị trí..." : "Chấm vị trí trên bản đồ"}
                    </button>
                    {currentLocation ? (
                        <button type="button" onClick={handleUseCurrentLocation} className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-sky-50">
                            Định vị lại
                        </button>
                    ) : null}
                    {pickedLocation ? (
                        <button type="button" onClick={() => { setPickedLocation(null); setRoute(null); setRouteError(null); setRouteDebug(null); }} className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50">
                            Bỏ điểm chấm
                        </button>
                    ) : null}
                    {selectedPost ? (
                        <button type="button" onClick={handleClearSelection} className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-sky-50">
                            Bỏ chọn phòng
                        </button>
                    ) : null}
                </div>
                {locationError ? <p className="mt-2 max-w-[260px] text-xs text-red-600">{locationError}</p> : null}
                {routeOrigin && selectedCoords ? (
                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                        <p>{pickedLocation ? "Khoảng cách từ điểm chấm:" : "Khoảng cách chim bay:"} {formatDistance(getDistanceKm(routeOrigin.lat, routeOrigin.lng, selectedCoords.lat, selectedCoords.lng) * 1000)}</p>
                        {route
                            ? <p>Đường đi: {formatDistance(route.distance)} · {formatDuration(route.duration)}</p>
                            : routeLoading
                                ? <p>Đang lấy tuyến đường...</p>
                                : routeError
                                    ? <p className="text-red-600">{routeError}</p>
                                    : null}
                    </div>
                ) : null}
            </div>

            <MapContainer center={defaultCenter} zoom={10} style={{ height: "100%", width: "100%" }}>
                <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                <MapAutoResize />
                <MapController posts={filteredPosts} filters={filters} setSearchLocation={setSearchLocation} />
                <MapImperativeRef mapRef={mapRef} />
                <PickLocationMarker enabled={pickMode} onPick={handlePickedMapLocation} />

                {/* ─── FIX: Single unified camera controller replaces two conflicting ones */}
                <MapCameraController
                    currentLocation={currentLocation}
                    selectedCoords={selectedCoords}
                    selectedPostId={selectedPostId}
                />

                {currentLocation ? (
                    <Marker position={[currentLocation.lat, currentLocation.lng]} icon={userIcon}>
                        <Popup><p className="font-bold">Vị trí hiện tại</p></Popup>
                    </Marker>
                ) : null}

                <MarkerClusterGroup>
                    {Object.entries(groupedPosts).map(([key, postsAtLocation]) => {
                        const first = postsAtLocation[0];
                        const lat = Number(first.rooms.latitude);
                        const lng = Number(first.rooms.longitude);
                        return (
                            <Marker
                                key={key}
                                ref={(marker) => {
                                    markerRefs.current[key] = marker;
                                }}
                                position={[lat, lng]}
                                icon={postIcon}
                                eventHandlers={{ click: () => handleSelectPost(first) }}
                            >
                                <Popup minWidth={220} maxWidth={260} className="map-popup-clean">
                                    <div className="px-1 pt-1 pb-2">
                                        <h3 className="mb-2 border-b border-gray-100 pb-1.5 text-sm font-bold text-blue-600">
                                            📍 {postsAtLocation.length} bài đăng tại đây
                                        </h3>
                                        <div className="max-h-[340px] space-y-2 overflow-y-auto pr-0.5">
                                            {postsAtLocation.map((p: any) => (
                                                <PostPopupCardWithActions
                                                    key={p.post_id}
                                                    p={p}
                                                    isSelected={selectedPost?.post_id === p.post_id}
                                                    onSelect={() => handleSelectPost(p)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MarkerClusterGroup>

                {searchLocation && isGeographicSearch ? (
                    <>
                        <Marker position={[searchLocation.lat, searchLocation.lng]} icon={searchIcon} zIndexOffset={1000}>
                            <Popup><p className="font-bold">Vị trí bạn tìm</p></Popup>
                        </Marker>
                        <Circle
                            center={[searchLocation.lat, searchLocation.lng]}
                            radius={20000}
                            pathOptions={{ color: "#3b82f6", fillOpacity: 0.08, weight: 1.5, dashArray: "6, 6" }}
                        />
                    </>
                ) : null}

                {pickedLocation ? (
                    <Marker position={[pickedLocation.lat, pickedLocation.lng]} icon={userIcon} zIndexOffset={1100}>
                        <Popup><p className="font-bold">Điểm bạn chấm</p></Popup>
                    </Marker>
                ) : null}

                {selectedCoords ? (
                    <Marker position={[selectedCoords.lat, selectedCoords.lng]} icon={searchIcon} zIndexOffset={1100}>
                        <Popup><p className="font-bold">Phòng đã chọn</p></Popup>
                    </Marker>
                ) : null}

                <RouteOverlay route={route} origin={currentLocation} destination={selectedCoords} fallbackLine={fallbackLine} />
            </MapContainer>

            {/* Route panel */}
            {routePanelOpen ? (
                <aside className="absolute bottom-4 left-4 z-[1000] w-[min(360px,calc(100%-2rem))] overflow-hidden rounded-2xl border border-sky-100 bg-white/95 shadow-xl backdrop-blur">
                    <div className="border-b border-sky-100 px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Routing</p>
                        <p className="mt-1 text-xs text-slate-500">
                            {currentLocation ? "Đã có vị trí hiện tại" : "Chưa có vị trí hiện tại"}
                        </p>
                    </div>

                    {selectedPost && selectedRoom ? (
                        <div className="p-3">
                            <div className="flex gap-3">
                                <Link href={`/rooms/${selectedPost.post_id}`} className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                    {selectedThumbnail ? (
                                        <img src={selectedThumbnail} alt={selectedPost.post_title} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">No image</div>
                                    )}
                                </Link>
                                <div className="min-w-0 flex-1">
                                    <Link href={`/rooms/${selectedPost.post_id}`} className="line-clamp-2 text-sm font-black leading-snug text-slate-900 hover:text-sky-700">
                                        {selectedPost.post_title}
                                    </Link>
                                    <p className="mt-1 text-sm font-bold text-sky-700">
                                        {Number(selectedRoom.room_price || 0).toLocaleString("vi-VN")} đ/tháng
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {selectedRoom.room_area ? `${selectedRoom.room_area} m²` : "Chưa rõ diện tích"}
                                        {selectedLocation ? ` · ${selectedLocation}` : ""}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2 text-xs">
                                <div>
                                    <p className="font-bold text-slate-400">Chim bay</p>
                                    <p className="mt-1 font-black text-slate-800">
                                        {currentLocation && selectedCoords
                                            ? formatDistance(getDistanceKm(currentLocation.lat, currentLocation.lng, selectedCoords.lat, selectedCoords.lng) * 1000)
                                            : "--"}
                                    </p>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-400">Đường đi</p>
                                    <p className="mt-1 font-black text-slate-800">
                                        {route
                                            ? `${formatDistance(route.distance)} · ${formatDuration(route.duration)}`
                                            : routeLoading ? "Đang lấy..." : "--"}
                                    </p>
                                </div>
                            </div>

                            {routeError ? <p className="mt-2 text-xs font-medium text-red-600">{routeError}</p> : null}
                            {!routeOrigin ? <p className="mt-2 text-xs text-amber-600">Bấm "Dùng vị trí hiện tại" hoặc "Chấm vị trí trên bản đồ" để lấy tuyến đường.</p> : null}

                            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                                <Link
                                    href={`/rooms/${selectedPost.post_id}`}
                                    className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-sky-700"
                                >
                                    Xem bài đăng
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleClearSelection}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                                >
                                    Đóng
                                </button>
                            </div>

                            {routeDebug ? (
                                <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    <summary className="cursor-pointer text-xs font-bold text-slate-700">Log chi tiết</summary>
                                    <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-relaxed text-slate-600">{routeDebug}</pre>
                                </details>
                            ) : null}
                        </div>
                    ) : (
                        <div className="p-4 text-sm text-slate-600">
                            Chọn một phòng trên bản đồ để xem tuyến đường và mở bài đăng.
                        </div>
                    )}
                </aside>
            ) : null}
        </div>
    );
}