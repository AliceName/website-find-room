"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import PostCard from "@/components/rooms/PostCard";
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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedPosts = filtered.slice(startIdx, startIdx + itemsPerPage);

    useEffect(() => {
        fetchData();
    }, []);

    // Handle search from navbar
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
        let result = [...posts];

        // Keyword search
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

        // Location filter
        if (filters.district) {
            result = result.filter((p) => p.rooms?.locations?.district === filters.district);
        }
        if (filters.ward) {
            result = result.filter((p) => p.rooms?.locations?.ward === filters.ward);
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

        setFiltered(result);
        setCurrentPage(1);
    };

    const handleReset = () => {
        setFiltered(posts);
        setCurrentPage(1);
    };

    return (
        <>
            {/* Header */}
            <div className="bg-white border-b border-gray-100 py-6 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900">
                                🏠 Danh sách phòng trọ
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">
                                {loading
                                    ? "Đang tải..."
                                    : `Tìm thấy ${filtered.length} bài đăng`}
                            </p>
                        </div>
                        <Link
                            href="/"
                            className="text-sm text-gray-500 hover:text-blue-600 font-medium"
                        >
                            ← Trang chủ
                        </Link>
                    </div>

                    {/* Search Filter Component */}
                    <SearchFilter
                        onSearch={handleSearch}
                        onReset={handleReset}
                        amenities={amenities}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {loading ? (
                    <Loader fullScreen={false} text="Đang tải phòng trọ..." />
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon="🏚️"
                        title="Không tìm thấy phòng trọ"
                        description="Hãy thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác"
                        action={{
                            label: "Xem tất cả phòng",
                            onClick: handleReset,
                        }}
                    />
                ) : (
                    <>
                        {/* Results Info */}
                        <div className="mb-6 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex gap-2 flex-wrap">
                                <Badge variant="info" size="md">
                                    📊 {filtered.length} kết quả
                                </Badge>
                                <Badge variant="success" size="md">
                                    📄 Trang {currentPage}/{totalPages}
                                </Badge>
                            </div>
                        </div>

                        {/* Posts Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {paginatedPosts.map((post) => (
                                <Link
                                    key={post.post_id}
                                    href={`/rooms/${post.post_id}`}
                                >
                                    <PostCard post={post as any} />
                                </Link>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                canPreviousPage={currentPage > 1}
                                canNextPage={currentPage < totalPages}
                            />
                        )}
                    </>
                )}
            </div>
        </>
    );
}

export default function RoomsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
                <RoomsContent />
            </Suspense>
        </div>
    );
}
