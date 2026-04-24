// components/map/MapController.tsx
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { geocodeAddress } from "@/lib/services/geocode";

export function MapController({
    filters,
    posts,
    setSearchLocation,
}: {
    filters: any;
    posts: any[];
    setSearchLocation: (location: { lat: number; lng: number } | null) => void;
}) {
    const map = useMap();
    const lastKeyword = useRef<string>("");

    const safeFlyTo = (
        lat: number,
        lng: number,
        zoom = 13,
        options?: { animate?: boolean; duration?: number }
    ) => {
        const m = map as any;
        if (!m || !m._mapPane || !m.getContainer) return;

        const container = m.getContainer();
        if (!container || !container.isConnected) return;

        requestAnimationFrame(() => {
            try {
                m.flyTo([lat, lng], zoom, options);
            } catch {
                // ignore transient map lifecycle errors
            }
        });
    };

    useEffect(() => {
        const keyword = filters?.keyword?.trim() || "";

        // 1. Xử lý khi xóa trắng ô tìm kiếm hoặc từ khóa quá ngắn
        if (keyword.length < 2) {
            if (lastKeyword.current !== "") {
                setSearchLocation(null);
                lastKeyword.current = "";

                // Về lại bài đăng đầu tiên nếu có
                const first = posts.find((p) => p.rooms?.latitude && p.rooms?.longitude);
                if (first) {
                    safeFlyTo(Number(first.rooms.latitude), Number(first.rooms.longitude));
                }
            }
            return;
        }

        if (keyword === lastKeyword.current) return;

        const timeout = setTimeout(async () => {
            // 2. Nhận diện từ khóa mô tả (Không nên Geocode)
            const descriptionPattern = /phòng|căn hộ|trọ|giá rẻ|có gác|mini|máy lạnh|nội thất|studio/i;
            const isDescription = descriptionPattern.test(keyword);

            if (isDescription) {
                setSearchLocation(null);
                // Tìm bài đầu tiên khớp với mô tả để bay tới
                const firstMatch = posts.find((p) => p.rooms?.latitude && p.rooms?.longitude);
                if (firstMatch) {
                    safeFlyTo(Number(firstMatch.rooms.latitude), Number(firstMatch.rooms.longitude));
                }
                lastKeyword.current = keyword;
                return;
            }

            // 3. Tiến hành Geocode địa danh
            const query = filters?.district
                ? `${filters.district}, Hồ Chí Minh, Vietnam`
                : keyword.includes("Vietnam") ? keyword : `${keyword}, Hồ Chí Minh, Vietnam`;

            const location = await geocodeAddress(query);

            if (location) {
                setSearchLocation(location);
                safeFlyTo(location.lat, location.lng, 13, { animate: true, duration: 1.5 });
            } else {
                setSearchLocation(null);
                // Nếu không ra địa điểm, bay về bài đầu tiên có trong danh sách đã lọc
                if (posts.length > 0) {
                    const first = posts.find((p) => p.rooms?.latitude && p.rooms?.longitude);
                    if (first) {
                        safeFlyTo(Number(first.rooms.latitude), Number(first.rooms.longitude));
                    }
                }
            }
            lastKeyword.current = keyword;
        }, 800); // Tăng lên 800ms để người dùng gõ xong hẳn mới bay

        return () => clearTimeout(timeout);
    }, [filters?.keyword, filters?.district, posts]); // Thêm posts vào dependency để update khi danh sách lọc thay đổi

    return null;
}
