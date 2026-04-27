"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
import { ROOM_TYPES } from "@/components/common/SearchFilter";

const MapView = dynamic(() => import("@/components/map/MapView"), {
    ssr: false,
    loading: () => (
        <div className="h-full bg-gray-100 flex items-center justify-center text-gray-400 rounded-3xl">
            Đang khởi tạo bản đồ...
        </div>
    ),
});

interface PostWithDetails {
    post_id: string;
    post_title: string;
    post_created_at: string | null;
    view_count: number | null;
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
        roomamenities: { amenity_id: string; amenities: { amenity_id: string; amenity_name: string } | null }[];
    } | null;
}

function RoomsContent() {
    const searchParams = useSearchParams();
    const [posts, setPosts] = useState<PostWithDetails[]>([]);
    const [filtered, setFiltered] = useState<PostWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMapOpen, setIsMapOpen] = useState(true);
    const [isFiltering, setIsFiltering] = useState(false);
    const [currentFilters, setCurrentFilters] = useState<SearchFilters>({});
    const [allAmenities, setAllAmenities] = useState<{ amenity_id: string; amenity_name: string }[]>([]);

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
            handleSearch({ ...currentFilters, keyword: searchQuery });
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
                        view_count,
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
                            locations:location_id ( location_id, city, district, ward ),
                            roomamenities ( amenity_id, amenities ( amenity_id, amenity_name ) )
                        )
                    `)
                    .order("post_created_at", { ascending: false }),
                supabase.from("amenities").select("amenity_id, amenity_name").order("amenity_name", { ascending: true }),
            ]);

            if (postsRes.data) {
                setPosts(postsRes.data as unknown as PostWithDetails[]);
                setFiltered(postsRes.data as unknown as PostWithDetails[]);
            }
            if (amenitiesRes.data) {
                setAllAmenities(amenitiesRes.data);
            }
        } catch (err) {
            console.error("Lỗi lấy dữ liệu:", err);
        } finally {
            setLoading(false);
        }
    };

    const parseRange = (rangeStr: string | undefined): [number | undefined, number | undefined] => {
        if (!rangeStr || !rangeStr.includes('-')) return [undefined, undefined];
        const [min, max] = rangeStr.split('-');
        return [
            min ? Number(min) : undefined,
            max ? Number(max) : undefined,
        ];
    };

    // Compute dynamic filter options based on current posts
    const cityOptions = useMemo(() => {
        const counts = new Map<string, number>();
        posts.forEach((p) => {
            const city = p.rooms?.locations?.city;
            if (city) {
                counts.set(city, (counts.get(city) || 0) + 1);
            }
        });
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([city, count]) => ({ value: city, label: `${city} (${count})` }));
    }, [posts]);

    const districtOptions = useMemo(() => {
        const counts = new Map<string, number>();
        posts.forEach((p) => {
            const loc = p.rooms?.locations;
            if (loc?.district) {
                if (!currentFilters.city || loc.city === currentFilters.city) {
                    counts.set(loc.district, (counts.get(loc.district) || 0) + 1);
                }
            }
        });
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([district, count]) => ({ value: district, label: `${district} (${count})` }));
    }, [posts, currentFilters.city]);

    const amenityOptions = useMemo(() => {
        return allAmenities.map((a) => ({
            value: a.amenity_id,
            label: a.amenity_name,
        }));
    }, [allAmenities]);

    const handleSearch = (filters: SearchFilters) => {
        setIsFiltering(true);
        setCurrentFilters(filters);
        let result = [...posts];

        // Keyword search from URL or direct
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

        // Room type — filter by room_type_name mapped from slug
        if (filters.roomType) {
            const targetLabel = ROOM_TYPES.find(t => t.value === filters.roomType)?.label;
            if (targetLabel) {
                result = result.filter((p) => {
                    const rt = p.rooms?.room_types;
                    if (Array.isArray(rt)) {
                        return rt.some((r: any) => r.room_type_name === targetLabel);
                    }
                    return rt?.room_type_name === targetLabel;
                });
            }
        }

        // Price range
        if (filters.priceRange) {
            const [minPrice, maxPrice] = parseRange(filters.priceRange);
            result = result.filter((p) => {
                const price = p.rooms?.room_price || 0;
                if (minPrice !== undefined && maxPrice !== undefined) {
                    return price >= minPrice && price <= maxPrice;
                }
                if (minPrice !== undefined) {
                    return price >= minPrice;
                }
                return true;
            });
        }

        // Area range
        if (filters.areaRange) {
            const [minArea, maxArea] = parseRange(filters.areaRange);
            result = result.filter((p) => {
                const area = p.rooms?.room_area || 0;
                if (minArea !== undefined && maxArea !== undefined) {
                    return area >= minArea && area <= maxArea;
                }
                if (minArea !== undefined) {
                    return area >= minArea;
                }
                return true;
            });
        }

        // City filter
        if (filters.city) {
            result = result.filter((p) => p.rooms?.locations?.city === filters.city);
        }

        // District filter
        if (filters.district) {
            result = result.filter((p) => p.rooms?.locations?.district === filters.district);
        }

        // Amenities filter — room must have ALL selected amenities
        if (filters.amenities && filters.amenities.length > 0) {
            result = result.filter((p) => {
                const roomAmenityIds = p.rooms?.roomamenities?.map((ra) => ra.amenity_id) || [];
                return filters.amenities!.every((id) => roomAmenityIds.includes(id));
            });
        }

        // Sorting
        const sortBy = filters.sortBy || 'newest';
        switch (sortBy) {
            case 'newest':
                result.sort((a, b) => new Date(b.post_created_at || 0).getTime() - new Date(a.post_created_at || 0).getTime());
                break;
            case 'oldest':
                result.sort((a, b) => new Date(a.post_created_at || 0).getTime() - new Date(b.post_created_at || 0).getTime());
                break;
            case 'price_asc':
                result.sort((a, b) => (a.rooms?.room_price || 0) - (b.rooms?.room_price || 0));
                break;
            case 'price_desc':
                result.sort((a, b) => (b.rooms?.room_price || 0) - (a.rooms?.room_price || 0));
                break;
            case 'area_asc':
                result.sort((a, b) => (a.rooms?.room_area || 0) - (b.rooms?.room_area || 0));
                break;
            case 'area_desc':
                result.sort((a, b) => (b.rooms?.room_area || 0) - (a.rooms?.room_area || 0));
                break;
        }

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
                <div className="flex flex-col gap-5">
                    {/* FILTER BAR - Horizontal */}
                    <SearchFilter
                        onSearch={handleSearch}
                        onReset={handleReset}
                        onMapClick={() => setIsMapOpen((prev) => !prev)}
                        isMapOpen={isMapOpen}
                        cityOptions={cityOptions}
                        districtOptions={districtOptions}
                        amenityOptions={amenityOptions}
                    />

                    {/* MAP */}
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

                    {/* ROOM LIST */}
                    <div className={`flex-1 overflow-y-auto pr-1 custom-scrollbar transition-opacity duration-[220ms] ease-[var(--ease-out-quart)] ${isFiltering ? "opacity-70" : "opacity-100"}`}>
                        {loading ? (
                            <Loader fullScreen={false} text="Đang tìm phòng phù hợp nhất cho bạn..." />
                        ) : filtered.length === 0 ? (
                            <EmptyState
                                icon="🏚️"
                                title="Không tìm thấy phòng trọ"
                                description="Hãy thử nới lỏng bộ lọc hoặc đổi khu vực để xem thêm kết quả"
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
    );
}

export default function RoomsPage() {
    return (
        <Suspense fallback={<Loader fullScreen />}>
            <RoomsContent />
        </Suspense>
    );
}

