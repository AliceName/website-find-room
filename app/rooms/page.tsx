"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
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
    const [isMapOpen, setIsMapOpen] = useState(true);
    const [isFiltering, setIsFiltering] = useState(false);

    const cityOptions = useMemo(() => {
        const counts = new Map<string, number>();

        posts.forEach((post) => {
            const city = post.rooms?.locations?.city?.trim();
            if (!city) return;
            counts.set(city, (counts.get(city) || 0) + 1);
        });

        return Array.from(counts.entries())
            .map(([value, count]) => ({
                value,
                label: `${value} (${count})`,
            }))
            .sort((a, b) => a.value.localeCompare(b.value, "vi"));
    }, [posts]);
    
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
        setIsFiltering(true);
        setCurrentFilters(filters);
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
        requestAnimationFrame(() => setIsFiltering(false));
    };

    const handleReset = () => {
        setIsFiltering(true);
        setCurrentFilters({});
        setFiltered(posts);
        setCurrentPage(1);
        requestAnimationFrame(() => setIsFiltering(false));
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
            {/* HEADER */}
            <div className="sticky top-0 z-30 border-b border-app bg-surface/95 py-3 px-4 backdrop-blur">
                <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <h1 className="whitespace-nowrap text-xl font-black text-slate-950">
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
                        className="text-sm font-medium text-slate-500 transition hover:text-accent-app"
                    >
                        ← Trang chủ
                    </Link>
                </div>
            </div>

            {/* MAIN LAYOUT */}
            <div className="mx-auto w-full max-w-screen-2xl flex-1 overflow-hidden px-4 py-5">
                <div className="flex h-full min-h-[calc(100vh-100px)] gap-5">

                    {/* CỘT TRÁI: Bộ lọc */}
                    <aside className="hidden w-80 shrink-0 overflow-y-auto md:block">
                        <SearchFilter
                            onSearch={handleSearch}
                            onReset={handleReset}
                            onMapClick={() => setIsMapOpen((prev) => !prev)}
                            isMapOpen={isMapOpen}
                            amenities={amenities}
                            cityOptions={cityOptions}
                        />
                    </aside>

                    {/* CỘT PHẢI: Nội dung chính */}
                    <div className="flex flex-1 flex-col gap-4 overflow-hidden">

                        {/* BẢN ĐỒ - Tối ưu hóa việc truyền props */}
                        <div className={`shrink-0 overflow-hidden rounded-[1.75rem] border border-app bg-surface shadow-sm transition-all duration-[220ms] ease-[var(--ease-out-quart)] ${isMapOpen ? "max-h-80 opacity-100 translate-y-0" : "max-h-0 -translate-y-2 opacity-0"}`}>
                            {isMapOpen && (
                                <div className="h-80">
                                    <MapView
                                        posts={filtered}
                                        filters={currentFilters}
                                    />
                                </div>
                            )}
                        </div>

                        {/* DANH SÁCH PHÒNG */}
                        <div className={`flex-1 overflow-y-auto pr-1 custom-scrollbar transition-opacity duration-[220ms] ease-[var(--ease-out-quart)] ${isFiltering ? "opacity-70" : "opacity-100"}`}>
                            {loading ? (
                                <Loader fullScreen={false} text="Đang tìm phòng phù hợp nhất cho bạn..." />
                            ) : filtered.length === 0 ? (
                                <EmptyState
                                    icon="🏚️"
                                    title="Không tìm thấy phòng trọ"
                                    description="Hãy thử nới lỏng bộ lọc, đổi khu vực hoặc bỏ bớt tiện ích để xem thêm kết quả"
                                    action={{
                                        label: "Đặt lại tất cả bộ lọc",
                                        onClick: handleReset,
                                    }}
                                />
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 xl:grid-cols-3">
                                        {paginatedPosts.map((post, index) => (
                                            <Link
                                                key={post.post_id}
                                                href={`/rooms/${post.post_id}`}
                                                className="block animate-[fadeUp_420ms_var(--ease-out-quart)_both] transition-transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-accent-app focus:ring-offset-2"
                                                style={{ animationDelay: `${index * 45}ms` }}
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