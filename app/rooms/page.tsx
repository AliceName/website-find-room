"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
    Home,
    ArrowLeft,
    Sparkles,
    MapPinned,
    RotateCcw,
} from "lucide-react";

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
import { ROOM_TYPES } from "@/components/common/SearchFilter";

const MapView = dynamic(() => import("@/components/map/MapView"), {
    ssr: false,
    loading: () => (
        <div className="flex h-full items-center justify-center rounded-[2rem] border border-sky-100 bg-white">
            <div className="flex items-center gap-3 text-slate-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0EA5E9] border-t-transparent" />
                Đang tải bản đồ...
            </div>
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
        is_hidden?: boolean | null;
        room_types: {
            room_type_id: string;
            room_type_name: string;
        } | null;
        roomimages: {
            image_url: string;
            is_360: boolean | null;
        }[];
        locations: {
            location_id: string;
            city: string;
            district: string;
            ward: string;
        } | null;
        roomamenities: {
            amenity_id: string;
            amenities: {
                amenity_id: string;
                amenity_name: string;
            } | null;
        }[];
    } | null;
}

type ChatRoomResultsPayload = {
    postIds?: string[];
    focusPostId?: string;
    source?: string;
};

const CHAT_RESULTS_STORAGE_KEY = "findroom:pending-chat-results";
const CHAT_RESULTS_EVENT = "findroom:chat-room-results";

const CHAT_FILTER_SOURCE = "chatbot";

function parseOptionalNumber(value: string | null): number | null {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function RoomsContent() {
    const searchParams = useSearchParams();
    const focusLat = parseOptionalNumber(searchParams.get("focusLat"));
    const focusLng = parseOptionalNumber(searchParams.get("focusLng"));
    const focusPostId = searchParams.get("focusPostId") ?? undefined;
    const focusTitle = searchParams.get("focusTitle") ?? undefined;
    const openRoute = searchParams.get("openRoute") === "1";

    const [posts, setPosts] = useState<PostWithDetails[]>([]);
    const [filtered, setFiltered] = useState<PostWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMapOpen, setIsMapOpen] = useState(true);
    const [isFiltering, setIsFiltering] = useState(false);
    const [mapFocusTarget, setMapFocusTarget] = useState<{
        lat: number;
        lng: number;
        title?: string;
        postId?: string;
    } | null>(null);
    const [isChatFiltered, setIsChatFiltered] = useState(false);

    const [currentFilters, setCurrentFilters] = useState<SearchFilters>({});
    const [allAmenities, setAllAmenities] = useState<
        { amenity_id: string; amenity_name: string }[]
    >([]);

    // PAGINATION
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedPosts = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const applyChatResults = (payload: ChatRoomResultsPayload | null) => {
            const postIds = Array.isArray(payload?.postIds)
                ? payload.postIds.filter((id): id is string => typeof id === "string" && id.length > 0)
                : [];

            if (postIds.length === 0) return;

            if (posts.length === 0) {
                window.sessionStorage.setItem(CHAT_RESULTS_STORAGE_KEY, JSON.stringify(payload));
                return;
            }

            const order = new Map(postIds.map((id, index) => [id, index]));
            const matchedPosts = posts
                .filter((post) => order.has(post.post_id))
                .sort((a, b) => (order.get(a.post_id) ?? 0) - (order.get(b.post_id) ?? 0));

            if (matchedPosts.length === 0) return;

            const focusPost =
                (payload?.focusPostId
                    ? matchedPosts.find((post) => post.post_id === payload.focusPostId)
                    : null) ?? matchedPosts[0];

            if (focusPost) {
                const lat = Number(focusPost.rooms?.latitude);
                const lng = Number(focusPost.rooms?.longitude);
                if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
                    setMapFocusTarget({
                        lat,
                        lng,
                        title: focusPost.post_title,
                        postId: focusPost.post_id,
                    });
                }
            }

            setIsFiltering(true);
            setFiltered(matchedPosts);
            setCurrentPage(1);
            setIsMapOpen(true);
            setIsChatFiltered(payload?.source === CHAT_FILTER_SOURCE || payload?.source === "gemini-chat");

            requestAnimationFrame(() => {
                setIsFiltering(false);
                document.getElementById("rooms-map-section")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            });
        };

        const handleChatResults = (event: Event) => {
            applyChatResults((event as CustomEvent<ChatRoomResultsPayload>).detail ?? null);
        };

        window.addEventListener(CHAT_RESULTS_EVENT, handleChatResults);

        const pending = window.sessionStorage.getItem(CHAT_RESULTS_STORAGE_KEY);
        if (pending) {
            try {
                const payload = JSON.parse(pending) as ChatRoomResultsPayload;
                if (posts.length > 0) {
                    window.sessionStorage.removeItem(CHAT_RESULTS_STORAGE_KEY);
                }
                applyChatResults(payload);
            } catch {
                window.sessionStorage.removeItem(CHAT_RESULTS_STORAGE_KEY);
            }
        }

        return () => window.removeEventListener(CHAT_RESULTS_EVENT, handleChatResults);
    }, [posts]);

    useEffect(() => {
        const searchQuery = searchParams.get("search");
        if (searchQuery && posts.length > 0) {
            handleSearch({
                ...currentFilters,
                keyword: searchQuery,
            });
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
                            is_hidden,
                            vr_url,
                            latitude,
                            longitude,
                            room_types:room_type_id (
                                room_type_id,
                                room_type_name
                            ),
                            roomimages (
                                image_url,
                                is_360
                            ),
                            locations:location_id (
                                location_id,
                                city,
                                district,
                                ward
                            ),
                            roomamenities (
                                amenity_id,
                                amenities (
                                    amenity_id,
                                    amenity_name
                                )
                            )
                        )
                    `)
                    .order("post_created_at", { ascending: false }),

                supabase
                    .from("amenities")
                    .select("amenity_id, amenity_name")
                    .order("amenity_name", { ascending: true }),
            ]);

            if (postsRes.data) {
                const visiblePosts = (postsRes.data as unknown as PostWithDetails[]).filter(
                    (post) => post.rooms?.is_hidden !== true && post.rooms?.room_status !== false
                );
                setPosts(visiblePosts);
                setFiltered(visiblePosts);
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

    // ... (giữ nguyên toàn bộ logic parseRange, cityOptions, districtOptions, amenityOptions, handleSearch, handleReset)

    const parseRange = (rangeStr: string | undefined): [number | undefined, number | undefined] => {
        if (!rangeStr || !rangeStr.includes("-")) return [undefined, undefined];
        const [min, max] = rangeStr.split("-");
        return [min ? Number(min) : undefined, max ? Number(max) : undefined];
    };

    const cityOptions = useMemo(() => {
        const counts = new Map<string, number>();
        posts.forEach((p) => {
            const city = p.rooms?.locations?.city;
            if (city) counts.set(city, (counts.get(city) || 0) + 1);
        });
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([city, count]) => ({
                value: city,
                label: `${city} (${count})`,
            }));
    }, [posts]);

    const districtOptions = useMemo(() => {
        const counts = new Map<string, number>();
        posts.forEach((p) => {
            const loc = p.rooms?.locations;
            const wardOrDistrict = loc?.ward || loc?.district;
            if (wardOrDistrict) {
                if (!currentFilters.city || loc.city === currentFilters.city) {
                    counts.set(wardOrDistrict, (counts.get(wardOrDistrict) || 0) + 1);
                }
            }
        });
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([district, count]) => ({
                value: district,
                label: `${district} (${count})`,
            }));
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
        setIsChatFiltered(false);

        let result = [...posts];

        if (filters.keyword?.trim()) {
            const q = filters.keyword.toLowerCase();
            result = result.filter((p) =>
                p.post_title.toLowerCase().includes(q) ||
                p.rooms?.locations?.district?.toLowerCase().includes(q) ||
                p.rooms?.locations?.ward?.toLowerCase().includes(q) ||
                p.rooms?.locations?.city?.toLowerCase().includes(q)
            );
        }

        if (filters.roomType) {
            const targetLabel = ROOM_TYPES.find((t) => t.value === filters.roomType)?.label;
            if (targetLabel) {
                result = result.filter((p) => p.rooms?.room_types?.room_type_name === targetLabel);
            }
        }

        if (filters.priceRange) {
            const [minPrice, maxPrice] = parseRange(filters.priceRange);
            result = result.filter((p) => {
                const price = p.rooms?.room_price || 0;
                if (minPrice !== undefined && maxPrice !== undefined) {
                    return price >= minPrice && price <= maxPrice;
                }
                if (minPrice !== undefined) return price >= minPrice;
                return true;
            });
        }

        if (filters.areaRange) {
            const [minArea, maxArea] = parseRange(filters.areaRange);
            result = result.filter((p) => {
                const area = p.rooms?.room_area || 0;
                if (minArea !== undefined && maxArea !== undefined) {
                    return area >= minArea && area <= maxArea;
                }
                if (minArea !== undefined) return area >= minArea;
                return true;
            });
        }

        if (filters.city) {
            result = result.filter((p) => p.rooms?.locations?.city === filters.city);
        }
        if (filters.district) {
            result = result.filter((p) => {
                const loc = p.rooms?.locations;
                return (loc?.ward || loc?.district) === filters.district;
            });
        }
        if (filters.amenities && filters.amenities.length > 0) {
            result = result.filter((p) => {
                const roomAmenityIds = p.rooms?.roomamenities?.map((ra) => ra.amenity_id) || [];
                return filters.amenities!.every((id) => roomAmenityIds.includes(id));
            });
        }

        // Sort
        switch (filters.sortBy || "newest") {
            case "price_asc":
                result.sort((a, b) => (a.rooms?.room_price || 0) - (b.rooms?.room_price || 0));
                break;
            case "price_desc":
                result.sort((a, b) => (b.rooms?.room_price || 0) - (a.rooms?.room_price || 0));
                break;
            case "area_asc":
                result.sort((a, b) => (a.rooms?.room_area || 0) - (b.rooms?.room_area || 0));
                break;
            case "area_desc":
                result.sort((a, b) => (b.rooms?.room_area || 0) - (a.rooms?.room_area || 0));
                break;
            case "oldest":
                // Tin cũ nhất -> tăng dần theo post_created_at
                result.sort((a, b) =>
                    new Date(a.post_created_at || 0).getTime() -
                    new Date(b.post_created_at || 0).getTime()
                );
                break;
            default:
                // Tin mới nhất -> giảm dần theo post_created_at
                result.sort((a, b) =>
                    new Date(b.post_created_at || 0).getTime() - new Date(a.post_created_at || 0).getTime()
                );
        }


        setFiltered(result);
        setCurrentPage(1);
        requestAnimationFrame(() => setIsFiltering(false));
    };

    const handleReset = () => {
        setCurrentFilters({});
        setFiltered(posts);
        setCurrentPage(1);
        setIsChatFiltered(false);
        setMapFocusTarget(null);
    };

    const handleResetChatFilter = () => {
        setFiltered(posts);
        setCurrentPage(1);
        setIsChatFiltered(false);
        setMapFocusTarget(null);
        window.sessionStorage.removeItem(CHAT_RESULTS_STORAGE_KEY);
    };

    const handleFocusPostOnMap = (post: PostWithDetails) => {
        const lat = Number(post.rooms?.latitude);
        const lng = Number(post.rooms?.longitude);

        if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) return;

        setMapFocusTarget({
            lat,
            lng,
            title: post.post_title,
            postId: post.post_id,
        });
        setIsMapOpen(true);
        requestAnimationFrame(() => {
            document.getElementById("rooms-map-section")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        });
    };

    return (
        <div className="relative min-h-screen bg-[#F0F9FF] text-slate-800 overflow-hidden">
            {/* Background Pattern + Glow */}
            <div className="fixed inset-0 -z-10">
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, #bae6fd 1px, transparent 1px), linear-gradient(to bottom, #bae6fd 1px, transparent 1px)",
                        backgroundSize: "40px 40px",
                    }}
                />
                <div className="absolute left-[-200px] top-[-150px] h-[600px] w-[600px] rounded-full bg-[#7DD3FC]/40 blur-[120px]" />
                <div className="absolute bottom-[-180px] right-[-180px] h-[550px] w-[550px] rounded-full bg-[#0EA5E9]/30 blur-[130px]" />
            </div>

            {/* HEADER */}
            <div className="sticky top-0 z-50 border-b border-sky-100 bg-white/90 backdrop-blur-2xl">
                <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-5 py-5">
                    <div className="flex items-center gap-4">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#7DD3FC] shadow-lg shadow-sky-300"
                        >
                            <Home className="h-6 w-6 text-white" />
                        </motion.div>

                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900">
                                FindRoom
                            </h1>
                            <div className="mt-1 flex items-center gap-2">
                                <Badge variant="info" size="md">
                                    {filtered.length} kết quả
                                </Badge>
                                <span className="flex items-center gap-1 text-xs font-semibold text-[#0EA5E9]">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Smart Search
                                </span>
                            </div>
                        </div>
                    </div>

                    <Link
                        href="/"
                        className="group flex items-center gap-2 rounded-2xl border border-sky-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition-all hover:-translate-y-0.5 hover:border-[#0EA5E9] hover:text-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Trang chủ
                    </Link>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="relative z-10 mx-auto max-w-screen-2xl px-4 py-8">
                {/* FILTER */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <SearchFilter
                        onSearch={handleSearch}
                        onReset={handleReset}
                        onMapClick={() => setIsMapOpen((prev) => !prev)}
                        isMapOpen={isMapOpen}
                        cityOptions={cityOptions}
                        districtOptions={districtOptions}
                        amenityOptions={amenityOptions}
                    />
                </motion.div>

                {isChatFiltered ? (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-4 py-4 shadow-sm"
                    >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-semibold text-emerald-900">
                                Bạn đang xem danh sách phòng được lọc từ chatbot.
                            </p>
                            <button
                                type="button"
                                onClick={handleResetChatFilter}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-emerald-700 sm:w-auto"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Hiện lại tất cả phòng
                            </button>
                        </div>
                    </motion.div>
                ) : null}

                {isChatFiltered ? (
                    <button
                        type="button"
                        onClick={handleResetChatFilter}
                        className="fixed bottom-5 left-4 z-[1100] inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white shadow-xl shadow-emerald-300 transition hover:bg-emerald-700 sm:bottom-6 sm:left-6"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Hiện tất cả phòng
                    </button>
                ) : null}

                {/* MAP */}
                <AnimatePresence>
                    {isMapOpen && (
                        <motion.div
                            id="rooms-map-section"
                            initial={{ opacity: 0, y: -12, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 560 }}
                            exit={{ opacity: 0, y: -12, height: 0 }}
                            transition={{ duration: 0.35 }}
                            className="mb-10 overflow-hidden rounded-[2.5rem] border border-sky-100 bg-white shadow-2xl"
                        >
                            <div className="flex flex-col gap-3 border-b border-sky-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-[#0EA5E9]">
                                        <MapPinned className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900">Bản đồ phòng trọ</h2>
                                        <p className="text-sm text-slate-500">Khám phá phòng ngay trên bản đồ với khung nhìn lớn hơn</p>
                                    </div>
                                </div>
                                <span className="inline-flex w-fit items-center rounded-full bg-sky-50 px-4 py-2 text-xs font-bold text-[#0EA5E9]">
                                    {filtered.length} phòng đang hiển thị
                                </span>
                            </div>
                            <div className="h-[500px] p-4">
                                <MapView
                                    posts={filtered}
                                    filters={currentFilters}
                                    focusTarget={mapFocusTarget ?? ((focusPostId && focusLat !== null && focusLng !== null) ? { lat: focusLat, lng: focusLng, title: focusTitle, postId: focusPostId } : (focusLat !== null && focusLng !== null ? { lat: focusLat, lng: focusLng, title: focusTitle } : null))}
                                    openRoutePanel={openRoute}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* RESULTS */}
                <div className={`transition-all duration-300 ${isFiltering ? "opacity-70" : "opacity-100"}`}>
                    {loading ? (
                        <Loader fullScreen={false} text="Đang tìm phòng phù hợp..." />
                    ) : filtered.length === 0 ? (
                        <div className="rounded-[2rem] border border-sky-100 bg-white p-12 text-center">
                            <EmptyState
                                icon="🏚️"
                                title="Không tìm thấy phòng"
                                description="Hãy thử nới lỏng bộ lọc hoặc đổi khu vực"
                                action={{
                                    label: "Đặt lại bộ lọc",
                                    onClick: handleReset,
                                }}
                            />
                        </div>
                    ) : (
                        <>
                            <motion.div
                                layout
                                className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
                            >
                                {paginatedPosts.map((post, index) => (
                                    <motion.div
                                        key={post.post_id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => handleFocusPostOnMap(post)}
                                            className="block w-full text-left"
                                        >
                                            <PostCard post={post as any} />
                                        </button>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {totalPages > 1 && (
                                <div className="mt-12 flex justify-center pb-12">
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
    );
}

export default function RoomsPage() {
    return (
        <Suspense fallback={<Loader fullScreen />}>
            <RoomsContent />
        </Suspense>
    );
}
