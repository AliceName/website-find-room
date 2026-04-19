"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import PostCard from "@/components/rooms/PostCard";

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

const PRICE_RANGES = [
    { label: "Tất cả giá", min: 0, max: Infinity },
    { label: "Dưới 2 triệu", min: 0, max: 2_000_000 },
    { label: "2 - 5 triệu", min: 2_000_000, max: 5_000_000 },
    { label: "5 - 10 triệu", min: 5_000_000, max: 10_000_000 },
    { label: "Trên 10 triệu", min: 10_000_000, max: Infinity },
];

const AREA_RANGES = [
    { label: "Tất cả diện tích", min: 0, max: Infinity },
    { label: "Dưới 20m²", min: 0, max: 20 },
    { label: "20 - 40m²", min: 20, max: 40 },
    { label: "40 - 60m²", min: 40, max: 60 },
    { label: "Trên 60m²", min: 60, max: Infinity },
];

export default function RoomsPage() {
    const [posts, setPosts] = useState<PostWithDetails[]>([]);
    const [filtered, setFiltered] = useState<PostWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [roomTypes, setRoomTypes] = useState<{ room_type_id: string; room_type_name: string }[]>([]);

    // Filters
    const [search, setSearch] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [priceRange, setPriceRange] = useState(0);
    const [areaRange, setAreaRange] = useState(0);
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [postsRes, typesRes] = await Promise.all([
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
            supabase.from("roomtypes").select("room_type_id, room_type_name"),
        ]);

        if (postsRes.data) setPosts(postsRes.data as unknown as PostWithDetails[]);
        if (typesRes.data) setRoomTypes(typesRes.data);
        setLoading(false);
    };

    const applyFilters = useCallback(() => {
        let result = [...posts];

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(p =>
                p.post_title.toLowerCase().includes(q) ||
                p.rooms?.locations?.district?.toLowerCase().includes(q) ||
                p.rooms?.locations?.ward?.toLowerCase().includes(q) ||
                p.rooms?.locations?.city?.toLowerCase().includes(q)
            );
        }

        // Room type
        if (selectedType !== "all") {
            result = result.filter(p => p.rooms?.room_types?.room_type_id === selectedType);
        }

        // Price range
        const pr = PRICE_RANGES[priceRange];
        if (pr.max !== Infinity || pr.min > 0) {
            result = result.filter(p => {
                const price = p.rooms?.room_price || 0;
                return price >= pr.min && price <= pr.max;
            });
        }

        // Area range
        const ar = AREA_RANGES[areaRange];
        if (ar.max !== Infinity || ar.min > 0) {
            result = result.filter(p => {
                const area = p.rooms?.room_area || 0;
                return area >= ar.min && area <= ar.max;
            });
        }

        // Status
        if (statusFilter === "available") {
            result = result.filter(p => p.rooms?.room_status !== false);
        } else if (statusFilter === "unavailable") {
            result = result.filter(p => p.rooms?.room_status === false);
        }

        // Sort
        if (sortBy === "newest") {
            result.sort((a, b) => new Date(b.post_created_at || 0).getTime() - new Date(a.post_created_at || 0).getTime());
        } else if (sortBy === "price_asc") {
            result.sort((a, b) => (a.rooms?.room_price || 0) - (b.rooms?.room_price || 0));
        } else if (sortBy === "price_desc") {
            result.sort((a, b) => (b.rooms?.room_price || 0) - (a.rooms?.room_price || 0));
        } else if (sortBy === "area_desc") {
            result.sort((a, b) => (b.rooms?.room_area || 0) - (a.rooms?.room_area || 0));
        }

        setFiltered(result);
    }, [posts, search, selectedType, priceRange, areaRange, statusFilter, sortBy]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    const resetFilters = () => {
        setSearch("");
        setSelectedType("all");
        setPriceRange(0);
        setAreaRange(0);
        setStatusFilter("all");
        setSortBy("newest");
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 pt-6 pb-4 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900">Danh sách phòng trọ</h1>
                            <p className="text-gray-500 text-sm mt-1">
                                {loading ? "Đang tải..." : `Tìm thấy ${filtered.length} bài đăng`}
                            </p>
                        </div>
                        <Link href="/" className="text-sm text-gray-500 hover:text-blue-600 font-medium">
                            ← Trang chủ
                        </Link>
                    </div>

                    {/* Search */}
                    <div className="relative mb-4">
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Tìm theo tên, quận, phường, thành phố..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    </div>

                    {/* Filters Row */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <select
                            value={selectedType}
                            onChange={e => setSelectedType(e.target.value)}
                            className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tất cả loại phòng</option>
                            {roomTypes.map(t => (
                                <option key={t.room_type_id} value={t.room_type_id}>{t.room_type_name}</option>
                            ))}
                        </select>

                        <select
                            value={priceRange}
                            onChange={e => setPriceRange(Number(e.target.value))}
                            className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {PRICE_RANGES.map((p, i) => (
                                <option key={i} value={i}>{p.label}</option>
                            ))}
                        </select>

                        <select
                            value={areaRange}
                            onChange={e => setAreaRange(Number(e.target.value))}
                            className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {AREA_RANGES.map((a, i) => (
                                <option key={i} value={i}>{a.label}</option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="available">Còn phòng</option>
                            <option value="unavailable">Hết phòng</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="newest">Mới nhất</option>
                            <option value="price_asc">Giá tăng dần</option>
                            <option value="price_desc">Giá giảm dần</option>
                            <option value="area_desc">Diện tích lớn nhất</option>
                        </select>
                    </div>

                    {/* Reset */}
                    {(search || selectedType !== "all" || priceRange !== 0 || areaRange !== 0 || statusFilter !== "all") && (
                        <button
                            onClick={resetFilters}
                            className="mt-3 text-sm text-red-500 font-bold hover:underline"
                        >
                            ✕ Xóa bộ lọc
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl overflow-hidden border border-gray-100 animate-pulse">
                                <div className="aspect-[4/3] bg-gray-200" />
                                <div className="p-5 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <span className="text-6xl">🏚️</span>
                        <p className="text-gray-500 text-xl font-medium mt-4">Không tìm thấy phòng trọ phù hợp</p>
                        <p className="text-gray-400 text-sm mt-2">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
                        <button onClick={resetFilters} className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
                            Xem tất cả phòng
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                        {filtered.map(post => (
                            <Link key={post.post_id} href={`/rooms/${post.post_id}`}>
                                <PostCard post={post as any} />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
