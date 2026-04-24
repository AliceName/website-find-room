"use client";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
    Circle,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import MarkerClusterGroup from "react-leaflet-markercluster";
import L from "leaflet";
import { useEffect, useState, useMemo } from "react";
import { MapController } from "./MapController";
import Link from "next/link";
import Image from "next/image";

// ✅ Icon marker cho bài đăng
const postIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

// ✅ Icon marker riêng cho vị trí tìm kiếm (màu khác để phân biệt)
const searchIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/447/447031.png",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
});

// ✅ Hàm tính khoảng cách Haversine (km)
function getDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // bán kính Trái Đất (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180; // Δlat
    const dLng = ((lng2 - lng1) * Math.PI) / 180; // Δlng
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ✅ Component auto resize (flyTo đã chuyển sang MapController)
function MapAutoResize({
    posts,
    searchLocation,
}: {
    posts: any[];
    searchLocation: { lat: number; lng: number } | null;
}) {
    const map = useMap();

    useEffect(() => {
        const timer = setTimeout(() => {
            const m = map as any;
            if (!m || !m._mapPane || !m.getContainer) return;

            const container = m.getContainer();
            if (!container || !container.isConnected) return;

            try {
                m.invalidateSize();
            } catch {
                return;
            }

            // Chỉ flyTo theo post khi KHÔNG có searchLocation
            if (!searchLocation && posts && posts.length > 0) {
                const firstPost = posts.find(
                    (p) => p.rooms?.latitude && p.rooms?.longitude
                );
                if (firstPost) {
                    const { latitude, longitude } = firstPost.rooms;
                    requestAnimationFrame(() => {
                        try {
                            m.flyTo([Number(latitude), Number(longitude)], 11, {
                                animate: true,
                                duration: 1.2,
                            });
                        } catch {
                            // ignore transient map lifecycle errors
                        }
                    });
                }
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [posts, map, searchLocation]);

    return null;
}

// ✅ Card từng bài đăng trong Popup — có ảnh thumbnail
function PostPopupCard({ p }: { p: any }) {
    const thumbnail = p.rooms?.roomimages?.find((img: any) => img.is_360 === false)?.image_url ?? null;

    return (
        <Link
            href={`/rooms/${p.post_id}`}
            className="block group rounded-lg overflow-hidden border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all"
        >
            {/* Ảnh thumbnail */}
            {thumbnail ? (
                <div className="w-full h-[120px] overflow-hidden bg-gray-100 relative">
                    <img
                        src={thumbnail}
                        alt={p.post_title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Badge giá nổi trên ảnh */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                        <span className="text-white font-black text-sm">
                            {p.rooms.room_price.toLocaleString()}đ
                        </span>
                    </div>
                </div>
            ) : (
                // Placeholder nếu không có ảnh
                <div className="w-full h-[80px] bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
                    <span className="text-3xl">🏠</span>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent px-2 py-1">
                        <span className="text-white font-black text-sm">
                            {p.rooms.room_price.toLocaleString()}đ
                        </span>
                    </div>
                </div>
            )}

            {/* Thông tin bên dưới ảnh */}
            <div className="p-2">
                <p className="font-bold text-xs text-gray-800 line-clamp-2 group-hover:text-blue-600 leading-snug">
                    {p.post_title}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        📐 {p.rooms.room_area} m²
                    </span>
                    <span className="text-[10px] text-blue-500 font-semibold">
                        Xem chi tiết →
                    </span>
                </div>
            </div>
        </Link>
    );
}
export default function MapView({
    posts,
    filters,
}: {
    posts: any[]; // ✅ Nhận TOÀN BỘ posts chưa lọc từ RoomsPage
    filters: any;
}) {
    const defaultCenter: [number, number] = [10.8411, 106.8098]; // Tọa độ trung tâm ban đầu (HCM)
    const [searchLocation, setSearchLocation] = useState<{
        lat: number;
        lng: number;
    } | null>(null);

    //  PHÂN BIỆT ĐỊA ĐIỂM VÀ MÔ TẢ
    const isGeographicSearch = useMemo(() => {
        const keyword = filters?.keyword?.toLowerCase() || "";
        const locationKeywords = ["quận", "huyện", "phường", "đường", "thành phố", "q.", "p.", "tp"];
        return locationKeywords.some(key => keyword.includes(key)) || !!filters?.district;
    }, [filters]);

    // LỌC BÀI ĐĂNG TRÊN MAP
    const filteredPosts = useMemo(() => {
        // check xem searchLocation có tồn tại không trước khi lọc
        // console.log("posts[0]:", JSON.stringify(posts[0], null, 2));
        // console.log("searchLocation:", searchLocation);
        // Chỉ lọc theo bán kính 20km nếu là tìm kiếm ĐỊA LÝ và tìm thấy tọa độ
        if (searchLocation && isGeographicSearch) {
            return posts.filter((post) => {
                const lat = Number(post.rooms?.latitude);
                const lng = Number(post.rooms?.longitude);
                if (isNaN(lat) || lat === 0) return false;
                return getDistance(searchLocation.lat, searchLocation.lng, lat, lng) <= 20;
            });
        }
        // Nếu tìm theo MÔ TẢ (căn hộ, giá rẻ...), hiện tất cả bài đăng đã lọc từ danh sách
        return posts;
    }, [posts, searchLocation, isGeographicSearch]);

    // Nhóm các bài đăng cùng tọa độ lại
    const groupedPosts = useMemo(() => {
        return filteredPosts.reduce((acc: Record<string, any[]>, post: any) => {
            const room = Array.isArray(post.rooms) ? post.rooms[0] : post.rooms;
            const lat = Number(room?.latitude);
            const lng = Number(room?.longitude);

            if (!isNaN(lat) && !isNaN(lng) && lat !== 0) {
                const key = `${lat}-${lng}`;
                if (!acc[key]) acc[key] = [];

                acc[key].push({
                    ...post,
                    rooms: { ...room, latitude: lat, longitude: lng },
                });
            }

            return acc;
        }, {});
    }, [filteredPosts]);

    return (
        <MapContainer
            center={defaultCenter}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
        >
            <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapAutoResize posts={filteredPosts} searchLocation={searchLocation} />
            <MapController
                posts={filteredPosts}
                filters={filters}
                setSearchLocation={setSearchLocation}
            />

            {/* ✅ Marker cho các bài đăng trong bán kính 20km */}
            <MarkerClusterGroup>
                {Object.entries(groupedPosts).map(([key, postsAtLocation]) => {
                    const first = postsAtLocation[0];
                    const lat = Number(first.rooms.latitude);
                    const lng = Number(first.rooms.longitude);

                    return (
                        <Marker key={key} position={[lat, lng]} icon={postIcon}>
                            <Popup
                                minWidth={220}
                                maxWidth={260}
                                className="map-popup-clean"
                            >
                                {/* Header số lượng */}
                                <div className="px-1 pt-1 pb-2">
                                    <h3 className="font-bold text-sm text-blue-600 border-b border-gray-100 pb-1.5 mb-2">
                                        📍 {postsAtLocation.length} bài đăng tại đây
                                    </h3>

                                    {/* Danh sách bài đăng — mỗi cái có ảnh */}
                                    <div className="space-y-2 max-h-[340px] overflow-y-auto pr-0.5">
                                        {postsAtLocation.map((p: any) => (
                                            <PostPopupCard key={p.post_id} p={p} />
                                        ))}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MarkerClusterGroup>

            {/* ✅ VÒNG TRÒN CHỈ HIỆN KHI TÌM ĐỊA DANH */}
            {searchLocation && isGeographicSearch && (
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
            )}
        </MapContainer>
    );
}