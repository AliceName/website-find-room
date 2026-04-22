"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import PostCard from "@/components/rooms/PostCard";
import dynamic from "next/dynamic";

import {
    SearchFilter,
    Pagination,
    EmptyState,
    Loader,
    Badge,
} from "@/components/common";
import type { SearchFilters } from "@/components/common";

const MapView = dynamic(() => import("@/components/map/MapView"), {
    ssr: false,
    loading: () => (
        <div className="h-full bg-gray-100 flex items-center justify-center text-gray-400">
            Đang khởi tạo bản đồ...
        </div>
    ),
});

interface PostWithDetails {
    post_id: string;
    post_title: string;
    post_created_at: string | null;
    rooms: {
        room_id: string;
        room_price: number;
        room_area: number | null;
        room_status: boolean | null;
        vr_url: string | null;
        latitude: number | null;   // ✅ bắt buộc có để map hoạt động
        longitude: number | null;  // ✅ bắt buộc có để map hoạt động
        room_types: { room_type_id: string; room_type_name: string } | null;
        roomimages: { image_url: string; is_360: boolean | null }[];
        locations: { location_id: string; city: string; district: string; ward: string } | null;

    } | null;
}


export default function RoomsPage() {
    const [posts, setPosts] = useState<PostWithDetails[]>([]);
    const [filtered, setFiltered] = useState<PostWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [amenities, setAmenities] = useState<any[]>([]);

    // UI State cho Map
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [currentFilters, setCurrentFilters] = useState<SearchFilters | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedPosts = filtered.slice(startIdx, startIdx + itemsPerPage);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [postsRes, amenitiesRes] = await Promise.all([
                supabase
                    .from("posts")
                    .select(`
                        post_id,
                        post_title,
                        post_created_at,
                        rooms:room_id (
                            room_id,
                            room_price,
                            room_area,
                            latitude,
                            longitude,
                            room_status,
                            vr_url,
                            room_types:room_type_id ( room_type_id, room_type_name ),
                            roomimages ( image_url, is_360 ),
                            locations:location_id ( location_id, city, district, ward )
                        )
                    `)
                    .order("post_created_at", { ascending: false }),
                supabase
                    .from("amenities")
                    .select("amenity_id, amenity_name")
                    .order("amenity_name"),
            ]);

            if (postsRes.data) {
                setPosts(postsRes.data as unknown as PostWithDetails[]);
                setFiltered(postsRes.data as unknown as PostWithDetails[]);
            }
            if (amenitiesRes.data) {
                setAmenities(amenitiesRes.data);
            }
        } catch (err) {
            console.error("Lỗi lấy dữ liệu:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (filters: SearchFilters) => {
        setCurrentFilters(filters); // Lưu lại filters để truyền cho Map
        let result = [...posts];

        // ✅ Keyword chỉ dùng để lọc list khi Map ĐÓNG
        // Khi Map MỞ: keyword được truyền vào MapView để geocode, KHÔNG lọc list theo text
        if (filters.keyword?.trim()) {
            const q = filters.keyword.toLowerCase();
            result = result.filter(
                (p) =>
                    p.post_title.toLowerCase().includes(q) ||
                    p.rooms?.locations?.district?.toLowerCase().includes(q) ||
                    p.rooms?.locations?.ward?.toLowerCase().includes(q)
            );
        }

        // Lọc theo district/ward từ LocationSelect (không phụ thuộc map)
        if (filters.district) {
            result = result.filter(
                (p) => p.rooms?.locations?.district === filters.district
            );
            if (filters.ward) {
                result = result.filter(
                    (p) => p.rooms?.locations?.ward === filters.ward
                );
            }
            // Tự mở map khi chọn khu vực
            setIsMapOpen(true);
        }

        // Cho phép lọc theo tiêu đề/mô tả bất kể Map đóng hay mở
        if (filters.keyword?.trim()) {
            const q = filters.keyword.toLowerCase();
            result = result.filter(
                (p) =>
                    p.post_title.toLowerCase().includes(q) ||
                    // Nếu bạn có cột description, hãy thêm vào đây
                    p.rooms?.locations?.district?.toLowerCase().includes(q) ||
                    p.rooms?.locations?.city?.toLowerCase().includes(q)
            );
        }

        // Lọc theo loại phòng (Room Type)
        if (filters.roomType) {
            result = result.filter((p) => p.rooms?.room_types?.room_type_id === filters.roomType);
        }

        // Room type filter
        if (filters.roomType) {
            result = result.filter((p) => p.rooms?.room_types?.room_type_id === filters.roomType);
        }

        // Price range
        if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
            result = result.filter((p) => {
                const price = p.rooms?.room_price || 0;
                return price >= filters.minPrice! && price <= filters.maxPrice!;
            });
        }

        // Area range
        if (filters.minArea !== undefined && filters.maxArea !== undefined) {
            result = result.filter((p) => {
                const area = p.rooms?.room_area || 0;
                return area >= filters.minArea! && area <= filters.maxArea!;
            });
        }

        // Sort by newest
        result.sort(
            (a, b) =>
                new Date(b.post_created_at || 0).getTime() -
                new Date(a.post_created_at || 0).getTime()
        );

        // Sau khi lọc xong, cập nhật state filtered
        setFiltered(result);
        setCurrentPage(1);
    };

    const handleReset = () => {
        setFiltered(posts);
        setCurrentFilters(null);
        setCurrentPage(1);
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header & Filter */}
            <div className="bg-white border-b border-gray-100 z-30 shadow-sm">
                <div
                    className={`mx-auto transition-all duration-500 p-4 lg:px-6 ${isMapOpen ? "max-w-full" : "max-w-7xl"
                        }`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-xl lg:text-2xl font-black text-gray-900">
                                🏠 Tìm phòng trọ
                            </h1>
                            <p className="text-gray-500 text-xs mt-1">
                                {loading
                                    ? "Đang tải..."
                                    : `Tìm thấy ${filtered.length} bài đăng`}
                            </p>
                        </div>
                        <Link
                            href="/"
                            className="hidden sm:block text-sm text-gray-500 font-bold hover:text-blue-600"
                        >
                            Trang chủ
                        </Link>
                    </div>

                    <SearchFilter
                        onSearch={handleSearch}
                        onReset={handleReset}
                        onMapClick={() => setIsMapOpen(!isMapOpen)}
                        isMapOpen={isMapOpen}
                        amenities={amenities}
                    />
                </div>
            </div>

            {/* Main Content */}
            <main className="flex flex-1 relative ">
                {/* Cột trái: Danh sách */}
                <div
                    className={`h-full overflow-y-auto transition-all duration-500 bg-gray-50 flex-shrink-0 ${isMapOpen
                        ? "hidden lg:block lg:w-[45%] xl:w-[40%]"
                        : "w-full"
                        }`}
                >
                    <div
                        className={`mx-auto p-4 lg:p-6 transition-all duration-500 ${isMapOpen ? "w-full" : "max-w-7xl"
                            }`}
                    >
                        {loading ? (
                            <Loader text="Đang tìm phòng..." />
                        ) : filtered.length === 0 ? (
                            <EmptyState
                                icon="🏚️"
                                title="Không tìm thấy phòng trọ"
                                description="Hãy thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác"
                                action={{ label: "Xem tất cả phòng", onClick: handleReset }}
                            />
                        ) : (
                            <>
                                <div className="mb-4">
                                    <Badge variant="info">📊 {filtered.length} kết quả</Badge>
                                </div>
                                <div
                                    className={`grid gap-4 md:gap-6 ${isMapOpen
                                        ? "grid-cols-1 xl:grid-cols-2"
                                        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                                        }`}
                                >
                                    {paginatedPosts.map((post) => (
                                        <Link key={post.post_id} href={`/rooms/${post.post_id}`}>
                                            <PostCard post={post as any} />
                                        </Link>
                                    ))}
                                </div>
                                <div className="mt-8 pb-24 lg:pb-8">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Cột phải: Map
                    ✅ Truyền toàn bộ `posts` (chưa lọc) vào Map
                    Map tự lọc theo 20km radius từ geocode keyword
                    List (filtered) và Map hoạt động độc lập, không xung đột
                */}
                {isMapOpen && (
                    <div className="fixed inset-0 pt-[180px] lg:pt-0 lg:relative lg:flex-1 h-full z-20 animate-in slide-in-from-right duration-500">
                        <div className="w-full h-full relative border-l border-gray-200 shadow-2xl">
                            <MapView posts={filtered} filters={currentFilters} />
                        </div>
                    </div>
                )}

                {/* Mobile FAB */}
                <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
                    <button
                        onClick={() => setIsMapOpen(!isMapOpen)}
                        className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full font-black text-sm shadow-2xl border-2 border-white/20 active:scale-95 transition-all"
                    >
                        {isMapOpen ? "📋 DANH SÁCH" : "📍 BẢN ĐỒ"}
                    </button>
                </div>
            </main>
        </div>
    );
}
