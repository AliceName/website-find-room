"use client";

import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import PostCard from "@/components/rooms/PostCard";
import MapView from "@/components/map/MapView";
import {
    SearchFilter,
    Pagination,
    EmptyState,
    Loader,
    Badge,
} from "@/components/common";
import type { SearchFilters } from "@/components/common";

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
        latitude: number | string | null;
        longitude: number | string | null;
        room_types: { room_type_id: string; room_type_name: string } | null;
        roomimages: { image_url: string; is_360: boolean | null }[];
        locations: { location_id: string; city: string; district: string; ward: string } | null;
    } | null;
}

function RoomsContent() {
    const searchParams = useSearchParams();
    const [posts, setPosts] = useState<PostWithDetails[]>([]);
    const [filtered, setFiltered] = useState<PostWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [amenities, setAmenities] = useState<any[]>([]);
    const [isMapOpen, setIsMapOpen] = useState(false);
    
    // Lưu trữ filters hiện tại để MapView có thể phản ứng
    const [currentFilters, setCurrentFilters] = useState<SearchFilters>({
        keyword: searchParams.get('search') || ''
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedPosts = filtered.slice(startIdx, startIdx + itemsPerPage);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const searchQuery = searchParams.get('search');
        if (searchQuery && posts.length > 0) {
            handleSearch({ keyword: searchQuery });
        }
    }, [searchParams, posts]);

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
                            room_status,
                            vr_url,
                            latitude,
                            longitude,
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
        setCurrentFilters(filters); // Cập nhật state filters để truyền cho MapView
        let result = [...posts];

        if (filters.keyword?.trim()) {
            const q = filters.keyword.toLowerCase();
            result = result.filter(
                (p) =>
                    p.post_title.toLowerCase().includes(q) ||
                    p.rooms?.locations?.district?.toLowerCase().includes(q) ||
                    p.rooms?.locations?.ward?.toLowerCase().includes(q) ||
                    p.rooms?.locations?.city?.toLowerCase().includes(q)
            );
        }

        if (filters.city) {
            result = result.filter((p) => p.rooms?.locations?.city === filters.city);
        }
        if (filters.district) {
            result = result.filter((p) => p.rooms?.locations?.district === filters.district);
        }
        if (filters.ward) {
            result = result.filter((p) => p.rooms?.locations?.ward === filters.ward);
        }
        if (filters.roomType) {
            result = result.filter((p) => p.rooms?.room_types?.room_type_id === filters.roomType);
        }

        // Lọc theo giá
        if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
            result = result.filter((p) => {
                const price = p.rooms?.room_price || 0;
                return price >= filters.minPrice! && price <= filters.maxPrice!;
            });
        }

        // Lọc theo diện tích
        if (filters.minArea !== undefined && filters.maxArea !== undefined) {
            result = result.filter((p) => {
                const area = p.rooms?.room_area || 0;
                return area >= filters.minArea! && area <= filters.maxArea!;
            });
        }

        result.sort(
            (a, b) =>
                new Date(b.post_created_at || 0).getTime() -
                new Date(a.post_created_at || 0).getTime()
        );

        setFiltered(result);
        setCurrentPage(1);
    };

    const handleReset = () => {
        setCurrentFilters({});
        setFiltered(posts);
        setCurrentPage(1);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* HEADER */}
            <div className="bg-white border-b border-gray-100 py-3 px-4 sticky top-0 z-30">
                <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-black text-gray-900 whitespace-nowrap">
                            🏠 FindRoom
                        </h1>
                        {!loading && (
                            <Badge variant="info" size="md">
                                {filtered.length} kết quả
                            </Badge>
                        )}
                    </div>
                    <Link
                        href="/"
                        className="text-sm text-gray-500 hover:text-blue-600 font-medium transition"
                    >
                        ← Trang chủ
                    </Link>
                </div>
            </div>

            {/* MAIN LAYOUT */}
            <div className="flex-1 max-w-screen-2xl mx-auto w-full px-4 py-4 overflow-hidden">
                <div className="flex gap-4 h-full min-h-[calc(100vh-100px)]">

                    {/* CỘT TRÁI: Bộ lọc */}
                    <aside className="w-72 shrink-0 overflow-y-auto hidden md:block">
                        <SearchFilter
                            onSearch={handleSearch}
                            onReset={handleReset}
                            onMapClick={() => setIsMapOpen((prev) => !prev)}
                            isMapOpen={isMapOpen}
                            amenities={amenities}
                        />
                    </aside>

                    {/* CỘT PHẢI: Nội dung chính */}
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden">

                        {/* BẢN ĐỒ - Tối ưu hóa việc truyền props */}
                        {isMapOpen && (
                            <div className="h-80 rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white shrink-0">
                                <MapView 
                                    posts={filtered} 
                                    filters={currentFilters} 
                                />
                            </div>
                        )}

                        {/* DANH SÁCH PHÒNG */}
                        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                            {loading ? (
                                <Loader fullScreen={false} text="Đang tìm phòng tốt nhất cho bạn..." />
                            ) : filtered.length === 0 ? (
                                <EmptyState
                                    icon="🏚️"
                                    title="Không tìm thấy phòng trọ"
                                    description="Hãy thử nới lỏng bộ lọc hoặc tìm kiếm khu vực lân cận"
                                    action={{
                                        label: "Đặt lại tất cả bộ lọc",
                                        onClick: handleReset,
                                    }}
                                />
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                                        {paginatedPosts.map((post) => (
                                            <Link
                                                key={post.post_id}
                                                href={`/rooms/${post.post_id}`}
                                                className="block transition-transform hover:-translate-y-1"
                                            >
                                                <PostCard post={post as any} />
                                            </Link>
                                        ))}
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="pb-8">
                                            <Pagination
                                                currentPage={currentPage}
                                                totalPages={totalPages}
                                                onPageChange={setCurrentPage}
                                                canPreviousPage={currentPage > 1}
                                                canNextPage={currentPage < totalPages}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RoomsPage() {
    return (
        <Suspense fallback={<Loader fullScreen />}>
            <RoomsContent />
        </Suspense>
    );
}